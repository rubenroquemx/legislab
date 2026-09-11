'use server';

import { db, gruposContactos, grupoMiembros, type NewGrupoContacto, type NewGrupoMiembro } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

export async function getGruposConMiembros(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    const grupos = await db
      .select()
      .from(gruposContactos)
      .where(eq(gruposContactos.officeId, activeOfficeId))
      .orderBy(desc(gruposContactos.createdAt));

    const miembros = await db.select().from(grupoMiembros);

    const fullGrupos = grupos.map(g => ({
      ...g,
      miembros: miembros.filter(m => m.grupoId === g.id)
    }));

    return { success: true, data: fullGrupos };
  } catch (error) {
    console.warn('Database query error or offline fallback (grupos):', error);
    return { success: false, data: [] };
  }
}

export async function createGrupo(data: {
  nombre: string;
  categoria: string;
  color?: string;
  whatsappLink?: string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);

    const newEntry: NewGrupoContacto = {
      officeId,
      nombre: data.nombre,
      categoria: data.categoria,
      color: data.color || 'blue',
      whatsappLink: data.whatsappLink || null,
    };

    const inserted = await db.insert(gruposContactos).values(newEntry).returning();
    revalidatePath('/grupos');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating grupo:', error);
    return { success: false, error: 'No se pudo guardar el grupo' };
  }
}

export async function addMiembroToGrupo(data: {
  grupoId: string;
  nombre: string;
  cargo: string;
  telefono: string;
  municipio?: string;
  foto?: string;
}) {
  try {
    const newMember: NewGrupoMiembro = {
      grupoId: data.grupoId as any,
      nombre: data.nombre,
      cargo: data.cargo,
      telefono: data.telefono,
      municipio: data.municipio || 'Centro',
      foto: data.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    };

    const inserted = await db.insert(grupoMiembros).values(newMember).returning();
    revalidatePath('/grupos');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error adding member to group:', error);
    return { success: false, error: 'No se pudo agregar el miembro al grupo' };
  }
}

export async function removeMiembroFromGrupo(miembroId: string) {
  try {
    await db.delete(grupoMiembros).where(eq(grupoMiembros.id, miembroId as any));
    revalidatePath('/grupos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error removing member from group:', error);
    return { success: false, error: 'No se pudo quitar el miembro' };
  }
}
