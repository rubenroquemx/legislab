'use server';

import { 
  db, 
  agendaEventos, 
  agendaSedes, 
  agendaTipos,
  offices,
  type NewAgendaEvento, 
  type NewAgendaSede,
  type NewAgendaTipo 
} from '@/db';
import { eq, desc, asc, and, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { 
  refreshAccessToken, 
  insertGoogleCalendarEvent, 
  updateGoogleCalendarEvent, 
  deleteGoogleCalendarEvent,
  fetchGoogleCalendarEvents 
} from '@/lib/google-calendar';

const DEFAULT_OFFICE_ID = '00000000-0000-0000-0000-000000000001';

export const DEFAULT_TIPOS_EVENTOS = [
  'Comisión',
  'Pleno',
  'Solemne',
  'Distrito',
  'Institucional',
  'Medios',
  'Reunión de Bancada',
];

export const DEFAULT_SEDES_PARLAMENTARIAS = [
  {
    nombre: 'Congreso del Estado (Recinto Oficial de Sesiones)',
    ubicacionUrl: 'https://share.google/RSlrkI2maowYbwLnH',
    referencia: 'Pleno',
  },
  {
    nombre: 'Sala de Usos Múltiples en Congreso',
    ubicacionUrl: 'https://share.google/RSlrkI2maowYbwLnH',
    referencia: 'Comisiones',
  },
  {
    nombre: 'IEPCT (Instituto Electoral y de Participación Ciudadana)',
    ubicacionUrl: 'https://share.google/Ns9yO6vsSIXS4zLMR',
    referencia: 'Institucional',
  },
  {
    nombre: 'Casa de Enlace Legislativo (Av. 27 de Febrero 402)',
    ubicacionUrl: 'https://maps.app.goo.gl/shareTabascoDistrito',
    referencia: 'Distrito',
  },
  {
    nombre: 'SOTOP (Secretaría de Obras Públicas)',
    ubicacionUrl: 'https://maps.google.com/?q=SOTOP+Villahermosa',
    referencia: 'Gobierno',
  },
  {
    nombre: 'Palacio de Gobierno del Estado',
    ubicacionUrl: 'https://maps.google.com/?q=Palacio+de+Gobierno+Villahermosa',
    referencia: 'Ejecutivo',
  },
];

/**
 * Encuentra el despacho por ID o fallback al primer despacho activo
 */
async function resolveOffice(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const officeList = await db.select().from(offices).where(eq(offices.id, officeId));
    if (officeList.length > 0) return officeList[0];
    const anyOffice = await db.select().from(offices).limit(1);
    if (anyOffice.length > 0) return anyOffice[0];

    const [created] = await db.insert(offices).values({
      id: DEFAULT_OFFICE_ID,
      name: 'Despacho Parlamentario Dip. Ruben Roque',
      titularName: 'Dip. Ruben Roque',
      titularEmail: 'contacto@rubenroque.mx',
      legislature: 'LXVI Legislatura',
      district: 'Distrito 04 Federal',
      state: 'Tabasco',
      party: 'MORENA',
    }).returning();
    return created;
  } catch (e) {
    console.warn('resolveOffice in agenda error:', e);
    return null;
  }
}

/**
 * Obtiene un access token válido para el despacho (refrescándolo automáticamente si está expirado)
 */
async function getValidGoogleTokenForOffice(officeId: string): Promise<{
  accessToken: string;
  calendarId: string;
} | null> {
  try {
    const office = await resolveOffice(officeId);
    if (!office || !office.googleCalendarConnected || !office.googleCalendarAccessToken) {
      return null;
    }

    const now = new Date();
    const expiry = office.googleCalendarTokenExpiry;
    let currentAccessToken = office.googleCalendarAccessToken;

    // Si el token expira en menos de 2 minutos y tenemos refresh_token, lo renovamos
    if (expiry && expiry.getTime() - now.getTime() < 2 * 60 * 1000 && office.googleCalendarRefreshToken) {
      try {
        const refreshed = await refreshAccessToken(office.googleCalendarRefreshToken);
        currentAccessToken = refreshed.accessToken;
        const newExpiry = new Date(Date.now() + (refreshed.expiresIn || 3600) * 1000);

        await db
          .update(offices)
          .set({
            googleCalendarAccessToken: refreshed.accessToken,
            googleCalendarTokenExpiry: newExpiry,
            updatedAt: new Date(),
          })
          .where(eq(offices.id, office.id));
      } catch (err) {
        console.warn('Error refreshing Google token in background:', err);
      }
    }

    return {
      accessToken: currentAccessToken,
      calendarId: office.googleCalendarId || 'primary',
    };
  } catch (e) {
    console.warn('getValidGoogleTokenForOffice error:', e);
    return null;
  }
}

// -------------------------------------------------------------
// EVENTOS DE LA AGENDA
// -------------------------------------------------------------
export async function getAgendaEventos(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const data = await db
      .select()
      .from(agendaEventos)
      .where(eq(agendaEventos.officeId, officeId))
      .orderBy(desc(agendaEventos.fecha));

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (agenda):', error);
    return { success: false, data: [] };
  }
}

export async function createAgendaEvento(data: {
  titulo: string;
  tipo?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugarNombre: string;
  lugarUrl?: string;
  color?: string;
  notas?: string;
  officeId?: string;
}) {
  try {
    const officeId = data.officeId || DEFAULT_OFFICE_ID;

    const newEntry: NewAgendaEvento = {
      officeId,
      titulo: data.titulo,
      tipo: data.tipo || 'Comisión',
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      lugarNombre: data.lugarNombre,
      lugarUrl: data.lugarUrl || 'https://maps.google.com',
      color: data.color || '#0284c7',
      notas: data.notas || '',
    };

    const inserted = await db.insert(agendaEventos).values(newEntry).returning();
    const createdEvent = inserted[0];

    // Sincronización automática con Google Calendar si está conectado
    try {
      const gcal = await getValidGoogleTokenForOffice(officeId);
      if (gcal) {
        const gEventId = await insertGoogleCalendarEvent(gcal.accessToken, gcal.calendarId, {
          titulo: newEntry.titulo,
          tipo: newEntry.tipo,
          fecha: newEntry.fecha,
          horaInicio: newEntry.horaInicio,
          horaFin: newEntry.horaFin,
          lugarNombre: newEntry.lugarNombre,
          lugarUrl: newEntry.lugarUrl || undefined,
          notas: newEntry.notas || undefined,
        });

        if (gEventId) {
          await db
            .update(agendaEventos)
            .set({ googleEventId: gEventId })
            .where(eq(agendaEventos.id, createdEvent.id));
          createdEvent.googleEventId = gEventId;
        }
      }
    } catch (gErr) {
      console.warn('Google Calendar auto-sync error on create:', gErr);
    }

    revalidatePath('/agenda');
    revalidatePath('/dashboard');

    return { success: true, data: createdEvent };
  } catch (error) {
    console.error('Error creating agenda evento:', error);
    return { success: false, error: 'No se pudo guardar el evento en agenda' };
  }
}

export async function updateAgendaEvento(
  id: string,
  data: Partial<{
    titulo: string;
    tipo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    lugarNombre: string;
    lugarUrl: string;
    color: string;
    notas: string;
    googleEventId: string;
  }>,
  officeId: string = DEFAULT_OFFICE_ID
) {
  try {
    const updated = await db
      .update(agendaEventos)
      .set(data)
      .where(eq(agendaEventos.id, id as any))
      .returning();

    const ev = updated[0];

    // Sincronización automática de actualización con Google Calendar
    try {
      const gcal = await getValidGoogleTokenForOffice(officeId);
      if (gcal && ev) {
        if (ev.googleEventId) {
          await updateGoogleCalendarEvent(gcal.accessToken, gcal.calendarId, ev.googleEventId, {
            titulo: ev.titulo,
            tipo: ev.tipo,
            fecha: ev.fecha,
            horaInicio: ev.horaInicio,
            horaFin: ev.horaFin,
            lugarNombre: ev.lugarNombre,
            lugarUrl: ev.lugarUrl || undefined,
            notas: ev.notas || undefined,
          });
        } else {
          // Si no tenía ID en Google Calendar, insertarlo
          const gEventId = await insertGoogleCalendarEvent(gcal.accessToken, gcal.calendarId, {
            titulo: ev.titulo,
            tipo: ev.tipo,
            fecha: ev.fecha,
            horaInicio: ev.horaInicio,
            horaFin: ev.horaFin,
            lugarNombre: ev.lugarNombre,
            lugarUrl: ev.lugarUrl || undefined,
            notas: ev.notas || undefined,
          });
          if (gEventId) {
            await db
              .update(agendaEventos)
              .set({ googleEventId: gEventId })
              .where(eq(agendaEventos.id, id as any));
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Calendar auto-sync error on update:', gErr);
    }

    revalidatePath('/agenda');
    revalidatePath('/dashboard');
    return { success: true, data: ev };
  } catch (error) {
    console.error('Error updating agenda evento:', error);
    return { success: false, error: 'No se pudo actualizar el evento' };
  }
}

export async function deleteAgendaEvento(id: string, officeId: string = DEFAULT_OFFICE_ID) {
  try {
    // Buscar si tenía googleEventId antes de borrar
    const existing = await db.select().from(agendaEventos).where(eq(agendaEventos.id, id as any));
    const ev = existing[0];

    await db.delete(agendaEventos).where(eq(agendaEventos.id, id as any));

    // Eliminar también de Google Calendar si estaba sincronizado
    if (ev && ev.googleEventId) {
      try {
        const gcal = await getValidGoogleTokenForOffice(officeId);
        if (gcal) {
          await deleteGoogleCalendarEvent(gcal.accessToken, gcal.calendarId, ev.googleEventId);
        }
      } catch (gErr) {
        console.warn('Google Calendar auto-sync error on delete:', gErr);
      }
    }

    revalidatePath('/agenda');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agenda evento:', error);
    return { success: false, error: 'No se pudo eliminar el evento' };
  }
}

// -------------------------------------------------------------
// GOOGLE CALENDAR ACTIONS (STATUS, DISCONNECT, FULL SYNC)
// -------------------------------------------------------------
export async function getGoogleCalendarStatusAction(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const office = await resolveOffice(officeId);
    if (!office) {
      return { success: false, connected: false };
    }

    return {
      success: true,
      connected: Boolean(office.googleCalendarConnected),
      email: office.googleCalendarEmail || '',
      lastSync: office.googleCalendarLastSync || null,
    };
  } catch (error) {
    console.warn('Error checking Google Calendar status:', error);
    return { success: false, connected: false };
  }
}

export async function disconnectGoogleCalendarAction(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const office = await resolveOffice(officeId);
    const targetId = office?.id || officeId;

    await db
      .update(offices)
      .set({
        googleCalendarConnected: false,
        googleCalendarEmail: null,
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarTokenExpiry: null,
        googleCalendarLastSync: null,
        updatedAt: new Date(),
      })
      .where(eq(offices.id, targetId));

    revalidatePath('/agenda');
    revalidatePath('/configuracion');
    return { success: true, message: 'Google Calendar desconectado exitosamente' };
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return { success: false, error: 'No se pudo desconectar Google Calendar' };
  }
}

export async function syncGoogleCalendarAction(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const gcal = await getValidGoogleTokenForOffice(officeId);
    if (!gcal) {
      return { success: false, error: 'Google Calendar no está conectado' };
    }

    // Obtener eventos locales del despacho
    const localEvents = await db
      .select()
      .from(agendaEventos)
      .where(eq(agendaEventos.officeId, officeId));

    let pushedCount = 0;

    // 1. Empujar eventos locales que no tengan ID en Google Calendar
    for (const ev of localEvents) {
      if (!ev.googleEventId) {
        const gEventId = await insertGoogleCalendarEvent(gcal.accessToken, gcal.calendarId, {
          titulo: ev.titulo,
          tipo: ev.tipo,
          fecha: ev.fecha,
          horaInicio: ev.horaInicio,
          horaFin: ev.horaFin,
          lugarNombre: ev.lugarNombre,
          lugarUrl: ev.lugarUrl || undefined,
          notas: ev.notas || undefined,
        });

        if (gEventId) {
          await db
            .update(agendaEventos)
            .set({ googleEventId: gEventId })
            .where(eq(agendaEventos.id, ev.id));
          pushedCount++;
        }
      }
    }

    // Actualizar timestamp de última sincronización
    await db
      .update(offices)
      .set({
        googleCalendarLastSync: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(offices.id, officeId));

    revalidatePath('/agenda');
    return {
      success: true,
      message: `Sincronización completada exitosamente. (${pushedCount} eventos actualizados)`,
      lastSync: new Date(),
    };
  } catch (error: any) {
    console.error('Error in syncGoogleCalendarAction:', error);
    return { success: false, error: error?.message || 'Error durante la sincronización' };
  }
}

// -------------------------------------------------------------
// SEDES FRECUENTES / LUGARES DEL DESPACHO
// -------------------------------------------------------------
export async function getAgendaSedes(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    let data = await db
      .select()
      .from(agendaSedes)
      .where(eq(agendaSedes.officeId, officeId))
      .orderBy(asc(agendaSedes.createdAt));

    // Si el despacho aún no tiene sedes registradas, inicializar con las predeterminadas
    if (data.length === 0) {
      const initialInserts: NewAgendaSede[] = DEFAULT_SEDES_PARLAMENTARIAS.map((s) => ({
        officeId,
        nombre: s.nombre,
        ubicacionUrl: s.ubicacionUrl,
        referencia: s.referencia,
      }));

      data = await db.insert(agendaSedes).values(initialInserts).returning();
    }

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (agenda sedes):', error);
    return { success: false, data: [] };
  }
}

export async function createAgendaSede(data: {
  nombre: string;
  ubicacionUrl: string;
  referencia?: string;
  officeId?: string;
}) {
  try {
    const officeId = data.officeId || DEFAULT_OFFICE_ID;
    const newSede: NewAgendaSede = {
      officeId,
      nombre: data.nombre.trim(),
      ubicacionUrl: data.ubicacionUrl.trim(),
      referencia: data.referencia?.trim() || '',
    };

    const inserted = await db.insert(agendaSedes).values(newSede).returning();
    revalidatePath('/agenda');
    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating agenda sede:', error);
    return { success: false, error: 'No se pudo guardar la sede' };
  }
}

export async function deleteAgendaSede(id: string) {
  try {
    await db.delete(agendaSedes).where(eq(agendaSedes.id, id as any));
    revalidatePath('/agenda');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agenda sede:', error);
    return { success: false, error: 'No se pudo eliminar la sede' };
  }
}

// -------------------------------------------------------------
// TIPOS DE EVENTO DEL DESPACHO
// -------------------------------------------------------------
export async function getAgendaTipos(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    let data = await db
      .select()
      .from(agendaTipos)
      .where(eq(agendaTipos.officeId, officeId))
      .orderBy(asc(agendaTipos.createdAt));

    // Si el despacho aún no tiene tipos registrados, inicializar con los predeterminados
    if (data.length === 0) {
      const initialInserts: NewAgendaTipo[] = DEFAULT_TIPOS_EVENTOS.map((nombre) => ({
        officeId,
        nombre,
        color: 'blue',
      }));

      data = await db.insert(agendaTipos).values(initialInserts).returning();
    }

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (agenda tipos):', error);
    return { success: false, data: [] };
  }
}

export async function createAgendaTipo(data: {
  nombre: string;
  color?: string;
  officeId?: string;
}) {
  try {
    const officeId = data.officeId || DEFAULT_OFFICE_ID;
    const newTipo: NewAgendaTipo = {
      officeId,
      nombre: data.nombre.trim(),
      color: data.color || 'blue',
    };

    const inserted = await db.insert(agendaTipos).values(newTipo).returning();
    revalidatePath('/agenda');
    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating agenda tipo:', error);
    return { success: false, error: 'No se pudo guardar el tipo de evento' };
  }
}

export async function deleteAgendaTipo(nombreOrId: string, officeId: string = DEFAULT_OFFICE_ID) {
  try {
    await db
      .delete(agendaTipos)
      .where(
        or(
          eq(agendaTipos.id, nombreOrId as any),
          and(eq(agendaTipos.officeId, officeId), eq(agendaTipos.nombre, nombreOrId))
        )
      );
    revalidatePath('/agenda');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agenda tipo:', error);
    return { success: false, error: 'No se pudo eliminar el tipo de evento' };
  }
}
