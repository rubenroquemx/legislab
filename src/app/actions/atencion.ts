'use server';

import { db, atencionMensajes, type NewAtencionMensaje } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const DEFAULT_OFFICE_ID = '00000000-0000-0000-0000-000000000001';

export async function getAtencionMensajes(officeId: string = DEFAULT_OFFICE_ID) {
  try {
    const data = await db
      .select()
      .from(atencionMensajes)
      .where(eq(atencionMensajes.officeId, officeId))
      .orderBy(desc(atencionMensajes.createdAt));

    return { success: true, data };
  } catch (error) {
    console.warn('Database query error or offline fallback (atencion):', error);
    return { success: false, data: [] };
  }
}

export async function createAtencionMensaje(data: {
  ciudadanoNombre: string;
  ciudadanoTelefono: string;
  ciudadanoFoto?: string;
  ultimoMensaje: string;
  horaUltimoMensaje: string;
  colonia?: string;
  officeId?: string;
}) {
  try {
    const officeId = data.officeId || DEFAULT_OFFICE_ID;

    const newEntry: NewAtencionMensaje = {
      officeId,
      ciudadanoNombre: data.ciudadanoNombre,
      ciudadanoTelefono: data.ciudadanoTelefono,
      ciudadanoFoto: data.ciudadanoFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ultimoMensaje: data.ultimoMensaje,
      horaUltimoMensaje: data.horaUltimoMensaje,
      colonia: data.colonia || 'Centro',
      estatus: 'Pendiente',
      sinLeer: true,
    };

    const inserted = await db.insert(atencionMensajes).values(newEntry).returning();
    revalidatePath('/atencion-ciudadana');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating atencion mensaje:', error);
    return { success: false, error: 'No se pudo guardar el mensaje de atención' };
  }
}
