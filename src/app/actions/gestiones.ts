'use server';

import { db, gestiones, iniciativas, iaGenerations, systemSettings, directorioContactos, type NewGestion, type NewIniciativa } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';
import { GoogleGenAI } from '@google/genai';
import { createGestionDriveFolderAction, uploadBase64DocumentToGestionDriveAction } from './drive';
import { formatFechaHistorial, formatHoraHistorial, appendHistorialToMeta, type EventoHistorial } from '@/lib/gestiones-utils';

export async function getFirstOfficeId(): Promise<string> {
  return await getActiveOfficeId();
}

// -------------------------------------------------------------
// GESTIONES ACTIONS (Multi-Tenant)
// -------------------------------------------------------------
export async function getGestiones(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    const data = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.officeId, activeOfficeId))
      .orderBy(desc(gestiones.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching gestiones:', error);
    return { success: false, error: 'Error al consultar gestiones', data: [] };
  }
}

export async function createGestion(data: {
  asunto: string;
  solicitante: string;
  curp?: string;
  claveElector?: string;
  seccionElectoral?: string;
  direccion?: string;
  colonia: string;
  municipio?: string;
  telefono?: string;
  email?: string;
  avatarUrl?: string;
  prioridad?: string;
  categoria?: string;
  estatus?: string;
  dependenciaCanalizada?: string;
  driveFolderUrl?: string;
  documentos?: any[];
  oficios?: any[];
  notas?: any[];
  notasInternas?: string;
  folio?: string;
  responsableId?: string | null;
  responsableNombre?: string;
  asignados?: any[] | string;
  ineBase64?: string;
  ineFileName?: string;
  creadorNombre?: string;
  creadorId?: string | null;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);
    const year = new Date().getFullYear();
    const randomFolioSuffix = Math.floor(1000 + Math.random() * 9000);
    const folio = data.folio || `GES-${year}-${randomFolioSuffix}`;

    let driveFolderUrl = data.driveFolderUrl || null;
    if (!driveFolderUrl) {
      try {
        const driveRes = await createGestionDriveFolderAction(folio, data.solicitante, officeId);
        if (driveRes.success && driveRes.folderUrl) {
          driveFolderUrl = driveRes.folderUrl;
        }
      } catch (dErr) {
        console.warn('Could not auto-create Drive folder for gestion:', dErr);
      }
    }

    let meta: any = {};
    if (data.notasInternas) {
      try { meta = JSON.parse(data.notasInternas); } catch {}
    }

    const creadorNombre = data.creadorNombre || 'Dip. Ruben Roque';
    meta.creadorNombre = creadorNombre;
    meta.creadorId = data.creadorId || null;

    let asignadosArr: any[] = [];
    if (data.asignados) {
      if (Array.isArray(data.asignados)) {
        asignadosArr = data.asignados;
      } else if (typeof data.asignados === 'string') {
        try { asignadosArr = JSON.parse(data.asignados); } catch {}
      }
    }
    meta.asignados = asignadosArr;

    let responsableId = data.responsableId || null;
    let responsableNombre = data.responsableNombre || '';
    if (!responsableId && asignadosArr.length > 0) {
      responsableId = asignadosArr[0].id || null;
      if (!responsableNombre) {
        responsableNombre = asignadosArr.map((a: any) => a.name || a.nombre).filter(Boolean).join(', ');
      }
    }
    if (responsableNombre) {
      meta.responsableNombre = responsableNombre;
    }

    const fechaNow = new Date();
    const eventoCreacion: EventoHistorial = {
      id: `hist-${Date.now()}`,
      fechaDisplay: formatFechaHistorial(fechaNow),
      horaDisplay: formatHoraHistorial(fechaNow),
      usuario: creadorNombre,
      accion: 'agregó esta gestión.',
      tipo: 'creacion',
      createdAt: fechaNow.toISOString(),
    };
    meta.historial = [eventoCreacion, ...(Array.isArray(meta.historial) ? meta.historial : [])];

    const newEntry: NewGestion = {
      officeId,
      folio,
      asunto: data.asunto,
      solicitante: data.solicitante,
      curp: data.curp || null,
      claveElector: data.claveElector || null,
      seccionElectoral: data.seccionElectoral || null,
      direccion: data.direccion || null,
      colonia: data.colonia || 'Centro',
      municipio: data.municipio || 'Centro',
      telefono: data.telefono || null,
      email: data.email || null,
      avatarUrl: data.avatarUrl || null,
      prioridad: data.prioridad || 'Media',
      categoria: data.categoria || 'General',
      estatus: data.estatus || 'Recibida',
      dependenciaCanalizada: data.dependenciaCanalizada || null,
      driveFolderUrl,
      responsableId,
      asignados: asignadosArr.length > 0 ? JSON.stringify(asignadosArr) : null,
      documentos: data.documentos ? JSON.stringify(data.documentos) : null,
      oficios: data.oficios ? JSON.stringify(data.oficios) : null,
      notas: data.notas ? JSON.stringify(data.notas) : null,
      notasInternas: JSON.stringify(meta),
    };

    const inserted = await db.insert(gestiones).values(newEntry).returning();

    // Si viene la imagen de la credencial INE capturada al inicio, subirla automáticamente al Drive de la gestión
    if (data.ineBase64 && inserted[0]) {
      try {
        await uploadBase64DocumentToGestionDriveAction(
          inserted[0].id,
          data.ineBase64,
          data.ineFileName || 'Credencial_Elector_INE.jpg',
          'image/jpeg',
          officeId,
          creadorNombre
        );
      } catch (uploadErr) {
        console.warn('Error subiendo imagen INE a Google Drive al crear gestión:', uploadErr);
      }
    }

    // Alta automática del contacto en el Directorio bajo la categoría "Ciudadano / Gestión"
    try {
      const cleanPhone = (data.telefono || '').replace(/\D/g, '');
      const existingContacts = await db
        .select()
        .from(directorioContactos)
        .where(eq(directorioContactos.officeId, officeId));

      const found = existingContacts.find(c => {
        const cPhone = (c.telefono || '').replace(/\D/g, '');
        const matchPhone = cleanPhone && cPhone && cleanPhone.length >= 7 && cleanPhone === cPhone;
        const matchName = c.nombre.trim().toLowerCase() === data.solicitante.trim().toLowerCase();
        return matchPhone || matchName;
      });

      const obsInicial = [
        {
          id: `obs-${Date.now()}`,
          fecha: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short' }),
          hora: new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }),
          autor: creadorNombre,
          texto: `Contacto registrado automáticamente por inicio de gestión con folio ${folio} (${data.asunto || 'Petición'}).`,
          esDiputado: true,
        }
      ];

      if (!found) {
        await db.insert(directorioContactos).values({
          officeId,
          nombre: data.solicitante.trim(),
          cargo: 'Ciudadano Solicitante',
          organizacion: data.colonia ? `${data.colonia}, ${data.municipio || 'Centro'}` : 'Atención Ciudadana',
          categoria: 'Ciudadano / Gestión',
          telefono: data.telefono?.trim() || 'Sin teléfono',
          email: data.email?.trim() || null,
          foto: data.avatarUrl || null,
          direccion: data.direccion?.trim() || (data.colonia ? `${data.colonia}, ${data.municipio || ''}` : null),
          observaciones: JSON.stringify(obsInicial),
        });
      } else {
        const updates: any = {};
        if (!found.foto && data.avatarUrl) updates.foto = data.avatarUrl;
        if (!found.categoria || found.categoria === 'Gabinete Estatal') {
          updates.categoria = 'Ciudadano / Gestión';
        }
        if (Object.keys(updates).length > 0) {
          await db.update(directorioContactos).set(updates).where(eq(directorioContactos.id, found.id));
        }
      }
      revalidatePath('/directorio');
    } catch (dirErr) {
      console.warn('Could not auto-register contact in Directorio for gestion:', dirErr);
    }

    revalidatePath('/gestiones');
    revalidatePath('/atencion-ciudadana');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating gestion:', error);
    return { success: false, error: 'No se pudo guardar la gestión' };
  }
}

export async function updateGestionStatus(id: string, nuevoEstado: string, usuarioNombre?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId();

    const [curr] = await db
      .select({ notasInternas: gestiones.notasInternas })
      .from(gestiones)
      .where(eq(gestiones.id, id))
      .limit(1);

    const { meta } = appendHistorialToMeta(curr?.notasInternas, {
      usuario: usuarioNombre || 'Usuario del Despacho',
      accion: `cambió el estatus a "${nuevoEstado}".`,
      tipo: 'estatus',
    });

    if (nuevoEstado === 'Resuelta' && !meta.fechaResolucion) {
      meta.fechaResolucion = new Date().toISOString();
    }

    const updated = await db
      .update(gestiones)
      .set({
        estatus: nuevoEstado,
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, id))
      .returning();

    revalidatePath(`/gestiones/${id}`);
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating gestion status:', error);
    return { success: false, error: 'No se pudo actualizar el estado de la gestión' };
  }
}

export async function updateGestionResponsableAction(
  gestionId: string,
  responsableId: string | null,
  responsableNombre?: string,
  usuarioActual?: string
) {
  try {
    const [curr] = await db
      .select({ notasInternas: gestiones.notasInternas })
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    const accionTexto = responsableNombre
      ? `asignó esta gestión a ${responsableNombre}.`
      : 'desasignó el responsable de esta gestión.';

    const { meta } = appendHistorialToMeta(curr?.notasInternas, {
      usuario: usuarioActual || 'Usuario del Despacho',
      accion: accionTexto,
      tipo: 'asignacion',
    });

    meta.responsableId = responsableId || null;
    meta.responsableNombre = responsableNombre || null;

    const updated = await db
      .update(gestiones)
      .set({
        responsableId: responsableId || null,
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath(`/gestiones/${gestionId}`);
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating responsable de gestion:', error);
    return { success: false, error: 'No se pudo actualizar el responsable de la gestión' };
  }
}

export async function updateGestionAsignadosAction(
  gestionId: string,
  asignados: any[],
  usuarioActual?: string
) {
  try {
    const [curr] = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (!curr) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    const asignadosNombres = Array.isArray(asignados)
      ? asignados.map((a: any) => a.name || a.nombre).filter(Boolean).join(', ')
      : '';

    const accionTexto = asignadosNombres
      ? `actualizó las asignaciones a: ${asignadosNombres}.`
      : 'removió todas las asignaciones de esta gestión.';

    const { meta } = appendHistorialToMeta(curr.notasInternas, {
      usuario: usuarioActual || 'Usuario del Despacho',
      accion: accionTexto,
      tipo: 'asignacion',
    });

    meta.asignados = asignados;
    meta.responsableNombre = asignadosNombres || null;
    meta.responsableId = asignados[0]?.id || null;

    const updated = await db
      .update(gestiones)
      .set({
        asignados: JSON.stringify(asignados),
        responsableId: asignados[0]?.id || null,
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath(`/gestiones/${gestionId}`);
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating asignados de gestion:', error);
    return { success: false, error: 'No se pudieron actualizar los usuarios asignados' };
  }
}

export async function updateGestionDataAction(
  gestionId: string,
  data: {
    asunto?: string;
    solicitante?: string;
    curp?: string;
    claveElector?: string;
    seccionElectoral?: string;
    direccion?: string;
    colonia?: string;
    municipio?: string;
    telefono?: string;
    email?: string;
    prioridad?: string;
    categoria?: string;
    estatus?: string;
    dependenciaCanalizada?: string;
    responsableId?: string | null;
    responsableNombre?: string;
    asignados?: any[];
    avatarUrl?: string | null;
  },
  usuarioActual?: string
) {
  try {
    const [curr] = await db
      .select({ notasInternas: gestiones.notasInternas })
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    const { meta } = appendHistorialToMeta(curr?.notasInternas, {
      usuario: usuarioActual || 'Usuario del Despacho',
      accion: 'actualizó los datos de la gestión.',
      tipo: 'edicion',
    });

    if (data.asignados !== undefined) {
      meta.asignados = data.asignados;
      if (Array.isArray(data.asignados) && data.asignados.length > 0) {
        data.responsableId = data.asignados[0].id;
        data.responsableNombre = data.asignados.map((a: any) => a.name || a.nombre).filter(Boolean).join(', ');
      }
    }

    if (data.responsableNombre !== undefined) {
      meta.responsableNombre = data.responsableNombre || null;
      meta.responsableId = data.responsableId || null;
    }

    const updates: any = {
      updatedAt: new Date(),
      notasInternas: JSON.stringify(meta),
    };

    if (data.asunto !== undefined) updates.asunto = data.asunto;
    if (data.solicitante !== undefined) updates.solicitante = data.solicitante;
    if (data.curp !== undefined) updates.curp = data.curp || null;
    if (data.claveElector !== undefined) updates.claveElector = data.claveElector || null;
    if (data.seccionElectoral !== undefined) updates.seccionElectoral = data.seccionElectoral || null;
    if (data.direccion !== undefined) updates.direccion = data.direccion || null;
    if (data.colonia !== undefined) updates.colonia = data.colonia;
    if (data.municipio !== undefined) updates.municipio = data.municipio;
    if (data.telefono !== undefined) updates.telefono = data.telefono || null;
    if (data.email !== undefined) updates.email = data.email || null;
    if (data.prioridad !== undefined) updates.prioridad = data.prioridad;
    if (data.categoria !== undefined) updates.categoria = data.categoria;
    if (data.estatus !== undefined) updates.estatus = data.estatus;
    if (data.dependenciaCanalizada !== undefined) updates.dependenciaCanalizada = data.dependenciaCanalizada || null;
    if (data.responsableId !== undefined) updates.responsableId = data.responsableId || null;
    if (data.asignados !== undefined) updates.asignados = JSON.stringify(data.asignados);
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl || null;

    const updated = await db
      .update(gestiones)
      .set(updates)
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath(`/gestiones/${gestionId}`);
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating gestion data:', error);
    return { success: false, error: 'No se pudo actualizar los datos de la gestión' };
  }
}

export async function toggleArchiveGestionAction(id: string, archivada: boolean) {
  try {
    const activeOfficeId = await getActiveOfficeId();

    const [curr] = await db
      .select({ notasInternas: gestiones.notasInternas })
      .from(gestiones)
      .where(eq(gestiones.id, id))
      .limit(1);

    let meta: any = {};
    if (curr?.notasInternas) {
      try { meta = JSON.parse(curr.notasInternas); } catch {}
    }

    meta.archivada = archivada;
    if (archivada) {
      meta.fechaArchivado = new Date().toISOString();
    } else {
      delete meta.fechaArchivado;
    }

    const updated = await db
      .update(gestiones)
      .set({
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, id))
      .returning();

    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0], archivada };
  } catch (error) {
    console.error('Error toggling archive gestion:', error);
    return { success: false, error: 'No se pudo archivar la gestión' };
  }
}

export async function updateGestion(id: string, data: Partial<NewGestion>) {
  try {
    const activeOfficeId = await getActiveOfficeId();
    const updated = await db
      .update(gestiones)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, id))
      .returning();

    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating gestion:', error);
    return { success: false, error: 'No se pudo actualizar la gestión' };
  }
}

export async function deleteGestion(id: string) {
  try {
    await db.delete(gestiones).where(eq(gestiones.id, id));
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting gestion:', error);
    return { success: false, error: 'No se pudo eliminar la gestión' };
  }
}

export async function addNotaGestion(gestionId: string, nota: {
  id?: string;
  fecha?: string;
  hora?: string;
  createdAt?: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}) {
  try {
    const existing = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    let notasList: any[] = [];
    if (existing[0].notas) {
      try {
        notasList = typeof existing[0].notas === 'string' ? JSON.parse(existing[0].notas) : existing[0].notas;
        if (!Array.isArray(notasList)) notasList = [];
      } catch {
        notasList = [];
      }
    }

    const now = new Date();
    const fechaMx = now.toLocaleDateString('es-MX', {
      timeZone: 'America/Mexico_City',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const horaMx = now.toLocaleTimeString('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
    });

    const finalNota = {
      id: nota.id || `nota-${Date.now()}`,
      fecha: nota.fecha && nota.fecha !== 'Hoy' ? nota.fecha : fechaMx,
      hora: nota.hora || horaMx,
      createdAt: nota.createdAt || now.toISOString(),
      autor: nota.autor,
      texto: nota.texto,
      esDiputado: nota.esDiputado ?? false,
    };

    notasList.push(finalNota);

    const { meta } = appendHistorialToMeta(existing[0].notasInternas, {
      usuario: nota.autor,
      accion: 'agregó una observación.',
      tipo: 'observacion',
      fecha: now,
    });

    const updated = await db
      .update(gestiones)
      .set({
        notas: JSON.stringify(notasList),
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath(`/gestiones/${gestionId}`);
    revalidatePath('/gestiones');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error adding nota to gestion:', error);
    return { success: false, error: 'No se pudo registrar la nota' };
  }
}

export async function addDocumentoGestion(gestionId: string, doc: {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  tamano: string;
  urlDrive: string;
}) {
  try {
    const existing = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    let docsList: any[] = [];
    if (existing[0].documentos) {
      try {
        docsList = typeof existing[0].documentos === 'string' ? JSON.parse(existing[0].documentos) : existing[0].documentos;
        if (!Array.isArray(docsList)) docsList = [];
      } catch {
        docsList = [];
      }
    }

    docsList.push(doc);

    const updated = await db
      .update(gestiones)
      .set({
        documentos: JSON.stringify(docsList),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath('/gestiones');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error adding documento to gestion:', error);
    return { success: false, error: 'No se pudo agregar el documento al expediente' };
  }
}

export async function addOficioGestion(gestionId: string, oficio: {
  id: string;
  folioOficio: string;
  tipoOficio: string;
  destinatario: string;
  cargo: string;
  dependencia: string;
  fecha: string;
  contenido: string;
}) {
  try {
    const existing = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    let oficiosList: any[] = [];
    if (existing[0].oficios) {
      try {
        oficiosList = typeof existing[0].oficios === 'string' ? JSON.parse(existing[0].oficios) : existing[0].oficios;
        if (!Array.isArray(oficiosList)) oficiosList = [];
      } catch {
        oficiosList = [];
      }
    }

    oficiosList.push(oficio);

    const updated = await db
      .update(gestiones)
      .set({
        oficios: JSON.stringify(oficiosList),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

    revalidatePath('/gestiones');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error adding oficio to gestion:', error);
    return { success: false, error: 'No se pudo guardar el oficio generado' };
  }
}

// -------------------------------------------------------------
// GEMINI API KEY CONFIGURATION
// -------------------------------------------------------------
export async function getGeminiApiKeyStatusAction() {
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey && envKey.trim().length > 10) return { configured: true, source: 'env' };

  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global')).limit(1);
    if (settings[0]?.geminiApiKey && settings[0].geminiApiKey.trim().length > 10) {
      return { configured: true, source: 'db' };
    }
  } catch {}

  return { configured: false };
}

export async function saveGeminiApiKeyAction(apiKey: string) {
  try {
    const cleanKey = apiKey.trim();
    if (!cleanKey || cleanKey.length < 10) {
      return { success: false, error: 'Clave de API inválida' };
    }

    await db
      .insert(systemSettings)
      .values({
        id: 'global',
        geminiApiKey: cleanKey,
      })
      .onConflictDoUpdate({
        target: systemSettings.id,
        set: {
          geminiApiKey: cleanKey,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err) {
    console.error('Error saving Gemini API key:', err);
    return { success: false, error: 'No se pudo guardar la clave de API' };
  }
}

// -------------------------------------------------------------
// EXTRAER DATOS DE CREDENCIAL INE (GEMINI VISION OCR)
// -------------------------------------------------------------
export async function extractIneDataAction(fileBase64: string, mimeType: string = 'image/jpeg') {
  let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim().length < 10) {
    try {
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global')).limit(1);
      if (settings[0]?.geminiApiKey && settings[0].geminiApiKey.trim().length > 10) {
        apiKey = settings[0].geminiApiKey.trim();
      }
    } catch {}
  }

  if (!apiKey || apiKey.trim().length < 10) {
    return {
      success: false,
      error: 'NO_API_KEY',
      message: 'Se requiere configurar una clave de Google Gemini (GEMINI_API_KEY) para escanear y extraer datos en vivo de credenciales reales.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Eres un sistema de visión artificial especializado en verificación y lectura de credenciales para votar (INE / IFE) de México.
Examina detenidamente la imagen enviada.

Instrucciones:
1. Determina si la imagen corresponde a una credencial para votar mexicana (INE / IFE) auténtica y legible.
2. Si NO es una credencial del INE o la imagen es ilegible/borrosa, pon "esCredencialIneValida": false y deja los demás campos vacíos.
3. Si SÍ es una credencial del INE, pon "esCredencialIneValida": true y extrae con total exactitud todos los campos visibles.
4. LOCALIZACIÓN EXACTA DE LA FOTOGRAFÍA DEL CIUDADANO:
- En las credenciales de elector mexicanas (INE/IFE), la fotografía principal del rostro del ciudadano siempre está ubicada en el LADO IZQUIERDO de la credencial (ocupando aproximadamente del 10% al 35% del ancho de la tarjeta).
- ESTRICTAMENTE PROHIBIDO recortar o confundir con: la firma, la huella dactilar, o los bloques de texto ("CLAVE DE ELECTOR", "CURP", "REGISTRO", etc.) que se encuentran en la zona central y derecha.
- Devuelve las coordenadas de la caja que enmarca la cabeza/rostro de la persona en "fotoBoundingBox": [ymin, xmin, ymax, xmax] en escala entera de 0 a 1000 respecto a la imagen completa recibida (donde ymin es el borde superior de la cabeza, xmin el borde izquierdo, ymax el borde inferior/mentón y xmax el borde derecho).
5. Responde ÚNICAMENTE con un JSON válido sin markdown, sin backticks y sin texto adicional.

Estructura JSON requerida:
{
  "esCredencialIneValida": true,
  "nombre": "Nombres del ciudadano",
  "primerApellido": "Primer apellido / Paterno",
  "segundoApellido": "Segundo apellido / Materno",
  "nombreCompleto": "Nombre completo en orden: Nombres ApellidoPaterno ApellidoMaterno",
  "curp": "CURP de 18 caracteres",
  "claveElector": "Clave de Elector de 18 caracteres",
  "seccionElectoral": "Sección electoral de 4 dígitos",
  "calle": "Calle y número exterior/interior",
  "colonia": "Colonia o localidad",
  "municipio": "Municipio o Alcaldía",
  "estado": "Estado (ej: TABASCO)",
  "codigoPostal": "Código postal de 5 dígitos",
  "direccionCompleta": "Dirección completa concatenada",
  "vigencia": "Año de vigencia",
  "fotoBoundingBox": [ymin, xmin, ymax, xmax]
}`;

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.esCredencialIneValida === false || (!parsed.curp && !parsed.claveElector && !parsed.nombre && !parsed.nombreCompleto)) {
        return {
          success: false,
          error: 'INVALID_DOCUMENT',
          message: 'La imagen subida no parece ser una credencial para votar (INE / IFE) legible. Asegúrate de capturar una foto clara y bien iluminada.',
        };
      }
      return { 
        success: true, 
        data: parsed,
        isRealAi: true,
        model: 'Gemini 2.5 Flash Vision'
      };
    } else {
      return { 
        success: false, 
        error: 'PARSE_ERROR', 
        message: 'No se pudieron extraer datos legibles de la imagen proporcionada.' 
      };
    }
  } catch (err: any) {
    console.error('Error en Gemini Vision INE extraction:', err);
    return {
      success: false,
      error: 'GEMINI_ERROR',
      message: err?.message || 'Error al conectar con la API de Google Gemini.',
    };
  }
}

// -------------------------------------------------------------
// INICIATIVAS ACTIONS (Multi-Tenant)
// -------------------------------------------------------------
export async function getIniciativas(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    const data = await db
      .select()
      .from(iniciativas)
      .where(eq(iniciativas.officeId, activeOfficeId))
      .orderBy(desc(iniciativas.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching iniciativas:', error);
    return { success: false, error: 'Error al consultar iniciativas', data: [] };
  }
}

export async function createIniciativa(data: {
  titulo: string;
  tipoDocumento: string;
  ambito: string;
  comision?: string;
  contenido?: string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const newEntry: NewIniciativa = {
      officeId,
      titulo: data.titulo,
      tipoDocumento: data.tipoDocumento,
      ambito: data.ambito,
      comision: data.comision || 'Comisión de Puntos Constitucionales',
      estado: 'Borrador',
      documentoCompleto: data.contenido || '',
    };

    const inserted = await db.insert(iniciativas).values(newEntry).returning();
    revalidatePath('/iniciativas');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating iniciativa:', error);
    return { success: false, error: 'No se pudo guardar la iniciativa' };
  }
}

// -------------------------------------------------------------
// IA GENERATIONS LOG (Multi-Tenant)
// -------------------------------------------------------------
export async function saveIaGeneration(data: {
  prompt: string;
  tipoDocumento: string;
  ambito: string;
  generatedText: string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const inserted = await db.insert(iaGenerations).values({
      officeId,
      prompt: data.prompt,
      tipoDocumento: data.tipoDocumento,
      ambito: data.ambito,
      generatedText: data.generatedText,
    }).returning();

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error saving IA generation log:', error);
    return { success: false, error: 'No se pudo guardar el registro de IA' };
  }
}
