'use server';

import { db, tareas, type NewTarea } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

export async function getTareas(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    const data = await db
      .select()
      .from(tareas)
      .where(eq(tareas.officeId, activeOfficeId))
      .orderBy(desc(tareas.createdAt));

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (tareas):', error);
    return { success: false, data: [] };
  }
}

export async function createTarea(data: {
  titulo: string;
  descripcion?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  usuarioCargo?: string;
  usuarioFoto?: string;
  usuarioWhatsapp?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja';
  estatus?: 'Pendiente' | 'En Proceso' | 'Completada';
  fechaLimite: string;
  horaLimite: string;
  moduloRelacionado?: string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const newEntry: NewTarea = {
      officeId,
      titulo: data.titulo,
      descripcion: data.descripcion || '',
      usuarioId: data.usuarioId || 'usr-1',
      usuarioNombre: data.usuarioNombre || 'Dip. Ruben Roque',
      usuarioCargo: data.usuarioCargo || 'Diputado Local (Titular)',
      usuarioFoto: data.usuarioFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      usuarioWhatsapp: data.usuarioWhatsapp || '993 111 2233',
      prioridad: data.prioridad || 'Media',
      estatus: data.estatus || 'Pendiente',
      fechaLimite: data.fechaLimite,
      horaLimite: data.horaLimite,
      moduloRelacionado: data.moduloRelacionado || 'Gestiones',
    };

    const inserted = await db.insert(tareas).values(newEntry).returning();
    revalidatePath('/tareas');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating tarea:', error);
    return { success: false, error: 'No se pudo guardar la tarea en base de datos' };
  }
}

export async function updateTareaStatus(id: string, nuevoEstatus: string) {
  try {
    const updated = await db
      .update(tareas)
      .set({ estatus: nuevoEstatus, updatedAt: new Date() })
      .where(eq(tareas.id, id as any))
      .returning();

    revalidatePath('/tareas');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating tarea status:', error);
    return { success: false, error: 'No se pudo actualizar el estatus de la tarea' };
  }
}

export async function deleteTarea(id: string) {
  try {
    await db.delete(tareas).where(eq(tareas.id, id as any));
    revalidatePath('/tareas');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting tarea:', error);
    return { success: false, error: 'No se pudo eliminar la tarea' };
  }
}
