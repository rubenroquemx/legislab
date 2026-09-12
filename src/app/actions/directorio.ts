'use server';

import { db, directorioContactos, type NewDirectorioContacto } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';
import { getCurrentTimeMexicoCity } from '@/lib/date-utils';

export interface ObservacionContactoRecord {
  id: string;
  fecha: string;
  hora: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}

export async function getContactos(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    const data = await db
      .select()
      .from(directorioContactos)
      .where(eq(directorioContactos.officeId, activeOfficeId))
      .orderBy(desc(directorioContactos.nombre));

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (directorio):', error);
    return { success: false, data: [] };
  }
}

export async function createContacto(data: {
  nombre: string;
  cargo: string;
  organizacion: string;
  categoria?: string;
  telefono: string;
  email?: string;
  foto?: string;
  fechaNacimiento?: string;
  direccion?: string;
  observaciones?: ObservacionContactoRecord[] | string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const obsString = Array.isArray(data.observaciones)
      ? JSON.stringify(data.observaciones)
      : data.observaciones || JSON.stringify([]);

    const newEntry: NewDirectorioContacto = {
      officeId,
      nombre: data.nombre,
      cargo: data.cargo,
      organizacion: data.organizacion,
      categoria: data.categoria || 'Gabinete Estatal',
      telefono: data.telefono,
      email: data.email || null,
      foto: data.foto || null,
      fechaNacimiento: data.fechaNacimiento || null,
      direccion: data.direccion || null,
      observaciones: obsString,
    };

    const inserted = await db.insert(directorioContactos).values(newEntry).returning();
    revalidatePath('/directorio');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating contacto:', error);
    return { success: false, error: 'No se pudo guardar el contacto' };
  }
}

export async function updateContacto(
  id: string,
  data: {
    nombre?: string;
    cargo?: string;
    organizacion?: string;
    categoria?: string;
    telefono?: string;
    email?: string;
    foto?: string | null;
    fechaNacimiento?: string;
    direccion?: string;
    observaciones?: ObservacionContactoRecord[] | string;
  },
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);

    const updateFields: any = {};
    if (data.nombre !== undefined) updateFields.nombre = data.nombre;
    if (data.cargo !== undefined) updateFields.cargo = data.cargo;
    if (data.organizacion !== undefined) updateFields.organizacion = data.organizacion;
    if (data.categoria !== undefined) updateFields.categoria = data.categoria;
    if (data.telefono !== undefined) updateFields.telefono = data.telefono;
    if (data.email !== undefined) updateFields.email = data.email || null;
    if (data.foto !== undefined) updateFields.foto = data.foto || null;
    if (data.fechaNacimiento !== undefined) updateFields.fechaNacimiento = data.fechaNacimiento || null;
    if (data.direccion !== undefined) updateFields.direccion = data.direccion || null;
    if (data.observaciones !== undefined) {
      updateFields.observaciones = Array.isArray(data.observaciones)
        ? JSON.stringify(data.observaciones)
        : data.observaciones;
    }

    const updated = await db
      .update(directorioContactos)
      .set(updateFields)
      .where(and(eq(directorioContactos.id, id), eq(directorioContactos.officeId, activeOfficeId)))
      .returning();

    revalidatePath('/directorio');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating contacto:', error);
    return { success: false, error: 'No se pudo actualizar el contacto' };
  }
}

export async function deleteContacto(id: string, officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    await db
      .delete(directorioContactos)
      .where(and(eq(directorioContactos.id, id), eq(directorioContactos.officeId, activeOfficeId)));

    revalidatePath('/directorio');
    return { success: true };
  } catch (error) {
    console.error('Error deleting contacto:', error);
    return { success: false, error: 'No se pudo eliminar el contacto' };
  }
}

export async function addObservacionAction(
  contactoId: string,
  texto: string,
  autor: string = 'Dip. Ruben Roque',
  esDiputado: boolean = true,
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);

    const records = await db
      .select()
      .from(directorioContactos)
      .where(and(eq(directorioContactos.id, contactoId), eq(directorioContactos.officeId, activeOfficeId)))
      .limit(1);

    if (!records || records.length === 0) {
      return { success: false, error: 'Contacto no encontrado' };
    }

    const contacto = records[0];
    let currentObs: ObservacionContactoRecord[] = [];
    if (contacto.observaciones) {
      try {
        currentObs = JSON.parse(contacto.observaciones);
        if (!Array.isArray(currentObs)) currentObs = [];
      } catch {
        currentObs = [];
      }
    }

    const now = new Date();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaFormatted = `${now.getDate()} ${meses[now.getMonth()]}`;

    const nuevaObs: ObservacionContactoRecord = {
      id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fecha: fechaFormatted,
      hora: getCurrentTimeMexicoCity(),
      autor,
      texto: texto.trim(),
      esDiputado,
    };

    const updatedObs = [...currentObs, nuevaObs];

    await db
      .update(directorioContactos)
      .set({ observaciones: JSON.stringify(updatedObs) })
      .where(eq(directorioContactos.id, contactoId));

    revalidatePath('/directorio');
    return { success: true, data: nuevaObs, allObservaciones: updatedObs };
  } catch (error) {
    console.error('Error adding observacion:', error);
    return { success: false, error: 'No se pudo guardar la observación' };
  }
}

export async function deleteObservacionAction(
  contactoId: string,
  observacionId: string,
  officeId?: string
) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);

    const records = await db
      .select()
      .from(directorioContactos)
      .where(and(eq(directorioContactos.id, contactoId), eq(directorioContactos.officeId, activeOfficeId)))
      .limit(1);

    if (!records || records.length === 0) {
      return { success: false, error: 'Contacto no encontrado' };
    }

    const contacto = records[0];
    let currentObs: ObservacionContactoRecord[] = [];
    if (contacto.observaciones) {
      try {
        currentObs = JSON.parse(contacto.observaciones);
        if (!Array.isArray(currentObs)) currentObs = [];
      } catch {
        currentObs = [];
      }
    }

    const updatedObs = currentObs.filter((o) => o.id !== observacionId);

    await db
      .update(directorioContactos)
      .set({ observaciones: JSON.stringify(updatedObs) })
      .where(eq(directorioContactos.id, contactoId));

    revalidatePath('/directorio');
    return { success: true, allObservaciones: updatedObs };
  } catch (error) {
    console.error('Error deleting observacion:', error);
    return { success: false, error: 'No se pudo eliminar la observación' };
  }
}
