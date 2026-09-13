'use server';

import { db, gestiones, iniciativas, iaGenerations, systemSettings, type NewGestion, type NewIniciativa } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';
import { GoogleGenAI } from '@google/genai';

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
      driveFolderUrl: data.driveFolderUrl || null,
      documentos: data.documentos ? JSON.stringify(data.documentos) : null,
      oficios: data.oficios ? JSON.stringify(data.oficios) : null,
      notas: data.notas ? JSON.stringify(data.notas) : null,
      notasInternas: data.notasInternas || null,
    };

    const inserted = await db.insert(gestiones).values(newEntry).returning();
    revalidatePath('/gestiones');
    revalidatePath('/atencion-ciudadana');
    revalidatePath('/dashboard');

    return { success: true, data: inserted[0] };
  } catch (error) {
    console.error('Error creating gestion:', error);
    return { success: false, error: 'No se pudo guardar la gestión' };
  }
}

export async function updateGestionStatus(id: string, nuevoEstado: string) {
  try {
    const activeOfficeId = await getActiveOfficeId();
    const updated = await db
      .update(gestiones)
      .set({
        estatus: nuevoEstado,
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, id))
      .returning();

    revalidatePath('/gestiones');
    revalidatePath('/dashboard');
    return { success: true, data: updated[0] };
  } catch (error) {
    console.error('Error updating gestion status:', error);
    return { success: false, error: 'No se pudo actualizar el estado de la gestión' };
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
  id: string;
  fecha: string;
  hora: string;
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

    notasList.push(nota);

    const updated = await db
      .update(gestiones)
      .set({
        notas: JSON.stringify(notasList),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestionId))
      .returning();

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
    const prompt = `Eres un sistema OCR de inteligencia artificial especializado en documentos oficiales de identificación de México (Credencial para Votar INE / IFE emitidas por el Instituto Nacional Electoral).
Analiza detalladamente la fotografía o documento proporcionado.
Extrae ÚNICAMENTE la información real y legible visible en el documento. Responde EXCLUSIVAMENTE con un JSON válido sin markdown, sin backticks y sin explicaciones.

Estructura JSON:
{
  "nombre": "Nombres del ciudadano",
  "primerApellido": "Primer apellido / Paterno",
  "segundoApellido": "Segundo apellido / Materno",
  "nombreCompleto": "Nombre completo en orden: Nombres PrimerApellido SegundoApellido",
  "curp": "CURP de 18 caracteres",
  "claveElector": "Clave de Elector de 18 caracteres",
  "seccionElectoral": "Sección electoral de 4 dígitos",
  "calle": "Calle y número exterior/interior",
  "colonia": "Colonia o localidad",
  "municipio": "Municipio o Alcaldía",
  "estado": "Estado (ej: TABASCO)",
  "codigoPostal": "Código postal de 5 dígitos",
  "direccionCompleta": "Dirección completa concatenada",
  "vigencia": "Año de vigencia"
}
Si un campo no es visible o no se puede leer con seguridad, deja una cadena vacía "".`;

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
      return { success: true, data: parsed };
    } else {
      return { success: false, error: 'PARSE_ERROR', message: 'No se pudieron extraer datos legibles de la imagen proporcionada.' };
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
