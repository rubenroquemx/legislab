'use server';

import { db, directorioContactos, type NewDirectorioContacto } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

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
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const newEntry: NewDirectorioContacto = {
      officeId,
      nombre: data.nombre,
      cargo: data.cargo,
      organizacion: data.organizacion,
      categoria: data.categoria || 'Gabinete Estatal',
      telefono: data.telefono,
      email: data.email || null,
      foto: data.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      fechaNacimiento: data.fechaNacimiento || null,
      direccion: data.direccion || null,
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
