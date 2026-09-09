'use server';

import { 
  db, 
  agendaEventos, 
  agendaSedes, 
  agendaTipos,
  type NewAgendaEvento, 
  type NewAgendaSede,
  type NewAgendaTipo 
} from '@/db';
import { eq, desc, asc, and, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
    revalidatePath('/agenda');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
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
  }>
) {
  try {
    const updated = await db
      .update(agendaEventos)
      .set(data)
      .where(eq(agendaEventos.id, id as any))
      .returning();
    revalidatePath('/agenda');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating agenda evento:', error);
    return { success: false, error: 'No se pudo actualizar el evento' };
  }
}

export async function deleteAgendaEvento(id: string) {
  try {
    await db.delete(agendaEventos).where(eq(agendaEventos.id, id as any));
    revalidatePath('/agenda');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agenda evento:', error);
    return { success: false, error: 'No se pudo eliminar el evento' };
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


