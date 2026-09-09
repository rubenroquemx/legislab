'use server';

import { db, agendaEventos, type NewAgendaEvento } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const DEFAULT_OFFICE_ID = '00000000-0000-0000-0000-000000000001';

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
