'use server';

import { db, agendaEventos, gestiones, directorioContactos, type NewAgendaEvento, type NewGestion, type NewDirectorioContacto } from '@/db';
import { eq, desc, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

export interface AgendaExportRecord {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugarNombre: string;
  lugarUrl: string;
  color: string;
  notas: string;
}

export interface GestionesExportRecord {
  id: string;
  folio: string;
  asunto: string;
  solicitante: string;
  colonia: string;
  municipio: string;
  telefono: string;
  email: string;
  categoria: string;
  prioridad: string;
  estatus: string;
  dependenciaCanalizada: string;
  notasInternas: string;
  fechaCreacion: string;
}

export interface DirectorioExportRecord {
  id: string;
  nombre: string;
  cargo: string;
  organizacion: string;
  categoria: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  direccion: string;
}

/**
 * Obtiene los eventos de la agenda listos para exportación
 */
export async function getAgendaExportDataAction(filters?: {
  startDate?: string;
  endDate?: string;
  tipo?: string;
  officeId?: string;
}) {
  try {
    const activeOfficeId = await getActiveOfficeId(filters?.officeId);
    const rows = await db
      .select()
      .from(agendaEventos)
      .where(eq(agendaEventos.officeId, activeOfficeId))
      .orderBy(asc(agendaEventos.fecha), asc(agendaEventos.horaInicio));

    let filtered = rows;

    if (filters?.startDate) {
      filtered = filtered.filter((r) => r.fecha >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter((r) => r.fecha <= filters.endDate!);
    }
    if (filters?.tipo && filters.tipo !== 'Todos') {
      filtered = filtered.filter((r) => r.tipo === filters.tipo);
    }

    const data: AgendaExportRecord[] = filtered.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo,
      fecha: r.fecha,
      horaInicio: r.horaInicio,
      horaFin: r.horaFin,
      lugarNombre: r.lugarNombre,
      lugarUrl: r.lugarUrl || '',
      color: r.color || '#0284c7',
      notas: r.notas || '',
    }));

    return {
      success: true,
      data,
      count: data.length,
    };
  } catch (error: any) {
    console.error('Error in getAgendaExportDataAction:', error);
    return { success: false, error: error?.message || 'Error al exportar agenda', data: [], count: 0 };
  }
}

/**
 * Obtiene las gestiones ciudadanas listas para exportación
 */
export async function getGestionesExportDataAction(filters?: {
  estatus?: string;
  categoria?: string;
  prioridad?: string;
  officeId?: string;
}) {
  try {
    const activeOfficeId = await getActiveOfficeId(filters?.officeId);
    const rows = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.officeId, activeOfficeId))
      .orderBy(desc(gestiones.createdAt));

    let filtered = rows;

    if (filters?.estatus && filters.estatus !== 'Todos') {
      filtered = filtered.filter((r) => r.estatus === filters.estatus);
    }
    if (filters?.categoria && filters.categoria !== 'Todos') {
      filtered = filtered.filter((r) => r.categoria === filters.categoria);
    }
    if (filters?.prioridad && filters.prioridad !== 'Todos') {
      filtered = filtered.filter((r) => r.prioridad === filters.prioridad);
    }

    const data: GestionesExportRecord[] = filtered.map((r) => ({
      id: r.id,
      folio: r.folio,
      asunto: r.asunto,
      solicitante: r.solicitante,
      colonia: r.colonia,
      municipio: r.municipio || 'Centro',
      telefono: r.telefono || '',
      email: r.email || '',
      categoria: r.categoria || 'General',
      prioridad: r.prioridad || 'Media',
      estatus: r.estatus || 'En Trámite',
      dependenciaCanalizada: r.dependenciaCanalizada || '',
      notasInternas: r.notasInternas || '',
      fechaCreacion: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
    }));

    return {
      success: true,
      data,
      count: data.length,
    };
  } catch (error: any) {
    console.error('Error in getGestionesExportDataAction:', error);
    return { success: false, error: error?.message || 'Error al exportar gestiones', data: [], count: 0 };
  }
}

/**
 * Importa en lote eventos de agenda mapeados desde un archivo Excel o CSV
 */
export async function importAgendaEventsAction(
  items: Array<{
    titulo: string;
    tipo?: string;
    fecha: string;
    horaInicio?: string;
    horaFin?: string;
    lugarNombre?: string;
    lugarUrl?: string;
    notas?: string;
  }>,
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    if (!items || items.length === 0) {
      return { success: false, error: 'No se recibieron eventos para importar' };
    }

    const validInserts: NewAgendaEvento[] = [];
    let skipped = 0;

    for (const item of items) {
      const titulo = (item.titulo || '').trim();
      const fecha = (item.fecha || '').trim();

      if (!titulo || !fecha) {
        skipped++;
        continue;
      }

      // Normalizar hora de inicio
      let horaInicio = (item.horaInicio || '09:00').trim();
      if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
        if (/^\d{1}:\d{2}$/.test(horaInicio)) {
          horaInicio = '0' + horaInicio;
        } else {
          horaInicio = '09:00';
        }
      }

      // Normalizar hora fin
      let horaFin = (item.horaFin || '').trim();
      if (!horaFin || !/^\d{2}:\d{2}$/.test(horaFin)) {
        const [h, m] = horaInicio.split(':').map((v) => parseInt(v, 10));
        const finH = ((isNaN(h) ? 9 : h) + 1) % 24;
        horaFin = String(finH).padStart(2, '0') + ':' + String(isNaN(m) ? 0 : m).padStart(2, '0');
      }

      validInserts.push({
        officeId: activeOfficeId,
        titulo,
        tipo: item.tipo?.trim() || 'Comisión',
        fecha,
        horaInicio,
        horaFin,
        lugarNombre: item.lugarNombre?.trim() || 'Recinto Oficial del Congreso',
        lugarUrl: item.lugarUrl?.trim() || 'https://maps.google.com',
        color: '#0284c7',
        notas: item.notas?.trim() || '',
      });
    }

    if (validInserts.length === 0) {
      return {
        success: false,
        error: 'Ninguna de las filas procesadas contiene el Título y la Fecha requeridos.',
      };
    }

    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < validInserts.length; i += batchSize) {
      const chunk = validInserts.slice(i, i + batchSize);
      await db.insert(agendaEventos).values(chunk);
      insertedCount += chunk.length;
    }

    revalidatePath('/agenda');
    revalidatePath('/dashboard');
    revalidatePath('/configuracion');

    return {
      success: true,
      insertedCount,
      skippedCount: skipped,
      message: 'Se importaron ' + insertedCount + ' eventos exitosamente' + (skipped > 0 ? ' (' + skipped + ' filas omitidas por datos incompletos)' : '') + '.',
    };
  } catch (error: any) {
    console.error('Error in importAgendaEventsAction:', error);
    return { success: false, error: error?.message || 'Error durante la importación de eventos' };
  }
}

/**
 * Importa en lote gestiones ciudadanas mapeadas desde un archivo Excel o CSV
 */
export async function importGestionesAction(
  items: Array<{
    folio?: string;
    asunto: string;
    solicitante: string;
    colonia?: string;
    municipio?: string;
    telefono?: string;
    email?: string;
    categoria?: string;
    prioridad?: string;
    estatus?: string;
    dependenciaCanalizada?: string;
    notasInternas?: string;
  }>,
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    if (!items || items.length === 0) {
      return { success: false, error: 'No se recibieron gestiones para importar' };
    }

    const currentYear = new Date().getFullYear();
    const validInserts: NewGestion[] = [];
    let skipped = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const asunto = (item.asunto || '').trim();
      const solicitante = (item.solicitante || '').trim();

      if (!asunto || !solicitante) {
        skipped++;
        continue;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedFolio = item.folio?.trim() || ('GES-' + currentYear + '-' + randomSuffix + '-' + (i + 1));

      validInserts.push({
        officeId: activeOfficeId,
        folio: generatedFolio,
        asunto,
        solicitante,
        colonia: item.colonia?.trim() || 'Col. Centro',
        municipio: item.municipio?.trim() || 'Centro',
        telefono: item.telefono?.trim() || null,
        email: item.email?.trim() || null,
        categoria: item.categoria?.trim() || 'General',
        prioridad: item.prioridad?.trim() || 'Media',
        estatus: item.estatus?.trim() || 'En Trámite',
        dependenciaCanalizada: item.dependenciaCanalizada?.trim() || null,
        notasInternas: item.notasInternas?.trim() || null,
      });
    }

    if (validInserts.length === 0) {
      return {
        success: false,
        error: 'Ninguna de las filas procesadas contiene el Asunto y Solicitante requeridos.',
      };
    }

    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < validInserts.length; i += batchSize) {
      const chunk = validInserts.slice(i, i + batchSize);
      await db.insert(gestiones).values(chunk);
      insertedCount += chunk.length;
    }

    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    revalidatePath('/configuracion');

    return {
      success: true,
      insertedCount,
      skippedCount: skipped,
      message: 'Se importaron ' + insertedCount + ' gestiones exitosamente' + (skipped > 0 ? ' (' + skipped + ' filas omitidas por datos incompletos)' : '') + '.',
    };
  } catch (error: any) {
    console.error('Error in importGestionesAction:', error);
    return { success: false, error: error?.message || 'Error durante la importación de gestiones' };
  }
}

/**
 * Obtiene los contactos del directorio institucional listos para exportación
 */
export async function getDirectorioExportDataAction(filters?: {
  categoria?: string;
  officeId?: string;
}) {
  try {
    const activeOfficeId = await getActiveOfficeId(filters?.officeId);
    const rows = await db
      .select()
      .from(directorioContactos)
      .where(eq(directorioContactos.officeId, activeOfficeId))
      .orderBy(asc(directorioContactos.nombre));

    let filtered = rows;
    if (filters?.categoria && filters.categoria !== 'Todos') {
      filtered = filtered.filter((r) => r.categoria === filters.categoria);
    }

    const data: DirectorioExportRecord[] = filtered.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      cargo: r.cargo,
      organizacion: r.organizacion,
      categoria: r.categoria || 'Gabinete Estatal',
      telefono: r.telefono,
      email: r.email || '',
      fechaNacimiento: r.fechaNacimiento || '',
      direccion: r.direccion || '',
    }));

    return {
      success: true,
      data,
      count: data.length,
    };
  } catch (error: any) {
    console.error('Error in getDirectorioExportDataAction:', error);
    return { success: false, error: error?.message || 'Error al exportar directorio', data: [], count: 0 };
  }
}

/**
 * Importa en lote contactos del directorio institucional desde Excel o CSV
 */
export async function importDirectorioAction(
  items: Array<{
    nombre: string;
    cargo?: string;
    organizacion?: string;
    categoria?: string;
    telefono?: string;
    email?: string;
    fechaNacimiento?: string;
    direccion?: string;
  }>,
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    if (!items || items.length === 0) {
      return { success: false, error: 'No se recibieron contactos para importar' };
    }

    const validInserts: NewDirectorioContacto[] = [];
    let skipped = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nombre = (item.nombre || '').trim();

      if (!nombre) {
        skipped++;
        continue;
      }

      validInserts.push({
        officeId: activeOfficeId,
        nombre,
        cargo: item.cargo?.trim() || 'Titular / Funcionario',
        organizacion: item.organizacion?.trim() || 'Gobierno del Estado',
        categoria: item.categoria?.trim() || 'Gabinete Estatal',
        telefono: item.telefono?.trim() || '993 000 0000',
        email: item.email?.trim() || null,
        foto: null,
        fechaNacimiento: item.fechaNacimiento?.trim() || null,
        direccion: item.direccion?.trim() || null,
      });
    }

    if (validInserts.length === 0) {
      return {
        success: false,
        error: 'Ninguna de las filas procesadas contiene el Nombre del contacto requerido.',
      };
    }

    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < validInserts.length; i += batchSize) {
      const chunk = validInserts.slice(i, i + batchSize);
      await db.insert(directorioContactos).values(chunk);
      insertedCount += chunk.length;
    }

    revalidatePath('/directorio');
    revalidatePath('/dashboard');
    revalidatePath('/configuracion');

    return {
      success: true,
      insertedCount,
      skippedCount: skipped,
      message: 'Se importaron ' + insertedCount + ' contactos exitosamente' + (skipped > 0 ? ' (' + skipped + ' filas omitidas por datos incompletos)' : '') + '.',
    };
  } catch (error: any) {
    console.error('Error in importDirectorioAction:', error);
    return { success: false, error: error?.message || 'Error durante la importación del directorio' };
  }
}
