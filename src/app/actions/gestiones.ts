'use server';

import { db, gestiones, iniciativas, iaGenerations, type NewGestion, type NewIniciativa } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

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
  colonia: string;
  telefono?: string;
  prioridad?: string;
  categoria?: string;
  officeId?: string;
}) {
  try {
    const officeId = await getActiveOfficeId(data.officeId);
    const year = new Date().getFullYear();
    const randomFolioSuffix = Math.floor(1000 + Math.random() * 9000);
    const folio = `GES-${year}-${randomFolioSuffix}`;

    const newEntry: NewGestion = {
      officeId,
      folio,
      asunto: data.asunto,
      solicitante: data.solicitante,
      colonia: data.colonia,
      telefono: data.telefono || null,
      prioridad: data.prioridad || 'Media',
      categoria: data.categoria || 'General',
      estatus: 'En Trámite',
    };

    const inserted = await db.insert(gestiones).values(newEntry).returning();
    revalidatePath('/gestiones');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating gestion:', error);
    return { success: false, error: 'No se pudo guardar la gestión' };
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