'use server';

import { db, offices, gestiones } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { 
  refreshDriveAccessToken, 
  createDriveSubfolder,
  getOrCreateRootDriveFolder,
  listFilesInDriveFolder,
  uploadFileToDriveFolder,
  deleteFileFromDrive,
  extractDriveFolderId
} from '@/lib/google-drive';
import { getActiveOfficeId } from '@/lib/session-office';
import { appendHistorialToMeta } from '@/lib/gestiones-utils';

/**
 * Encuentra el despacho por ID o fallback al despacho activo
 */
async function resolveOffice(officeId?: string) {
  try {
    const targetId = await getActiveOfficeId(officeId);
    const [office] = await db.select().from(offices).where(eq(offices.id, targetId)).limit(1);
    if (office) return office;

    const [created] = await db.insert(offices).values({
      id: targetId,
      name: 'Despacho Parlamentario',
      titularName: 'Diputado',
      titularEmail: '',
      legislature: 'LXVI Legislatura',
      district: 'Distrito 04 Federal',
      state: 'Tabasco',
      party: 'MORENA',
    }).returning();
    return created;
  } catch (e) {
    console.warn('resolveOffice error:', e);
    return null;
  }
}

/**
 * Obtiene un access token válido para Google Drive del despacho
 */
async function getValidDriveTokenForOffice(officeId?: string): Promise<{
  accessToken: string;
  rootFolderId: string | null;
  rootFolderUrl: string | null;
  office: any;
} | null> {
  try {
    const office = await resolveOffice(officeId);
    if (!office || !office.googleDriveConnected || !office.googleDriveAccessToken) {
      return null;
    }

    const now = new Date();
    const expiry = office.googleDriveTokenExpiry;
    let currentAccessToken = office.googleDriveAccessToken;

    // Renovar token si expira en < 2 minutos
    if (expiry && expiry.getTime() - now.getTime() < 2 * 60 * 1000 && office.googleDriveRefreshToken) {
      try {
        const refreshed = await refreshDriveAccessToken(office.googleDriveRefreshToken);
        currentAccessToken = refreshed.accessToken;
        const newExpiry = new Date(Date.now() + (refreshed.expiresIn || 3600) * 1000);

        await db
          .update(offices)
          .set({
            googleDriveAccessToken: refreshed.accessToken,
            googleDriveTokenExpiry: newExpiry,
            updatedAt: new Date(),
          })
          .where(eq(offices.id, office.id));
      } catch (err) {
        console.warn('Error refreshing Google Drive token in background:', err);
      }
    }

    let rootFolderId = office.googleDriveFolderId;
    let rootFolderUrl = office.googleDriveFolderUrl;

    // Asegurar carpeta raíz si no existe aún
    if (!rootFolderId && currentAccessToken) {
      try {
        const root = await getOrCreateRootDriveFolder(currentAccessToken, `LegisLab - ${office.name || 'Despacho'}`);
        rootFolderId = root.folderId;
        rootFolderUrl = root.folderUrl;
        await db
          .update(offices)
          .set({
            googleDriveFolderId: rootFolderId,
            googleDriveFolderUrl: rootFolderUrl,
            updatedAt: new Date(),
          })
          .where(eq(offices.id, office.id));
      } catch (fErr) {
        console.warn('Could not auto-create root folder in getValidDriveTokenForOffice:', fErr);
      }
    }

    return {
      accessToken: currentAccessToken,
      rootFolderId,
      rootFolderUrl,
      office,
    };
  } catch (e) {
    console.warn('getValidDriveTokenForOffice error:', e);
    return null;
  }
}

/**
 * Obtiene el estado actual de la conexión de Google Drive
 */
export async function getGoogleDriveStatusAction(officeId?: string) {
  try {
    const office = await resolveOffice(officeId);
    if (!office) {
      return { success: false, connected: false };
    }

    return {
      success: true,
      connected: Boolean(office.googleDriveConnected),
      email: office.googleDriveEmail || '',
      folderUrl: office.googleDriveFolderUrl || '',
      folderId: office.googleDriveFolderId || '',
    };
  } catch (error) {
    console.warn('Error fetching Google Drive status:', error);
    return { success: false, connected: false };
  }
}

/**
 * Actualiza la carpeta raíz de Google Drive manualmente
 */
export async function updateGoogleDriveFolderAction(
  folderUrl: string,
  folderId?: string,
  officeId?: string
) {
  try {
    const office = await resolveOffice(officeId);
    if (!office) {
      return { success: false, error: 'Despacho no encontrado' };
    }

    // Extraer Folder ID de la URL si no viene explícito
    let resolvedFolderId = folderId || '';
    if (!resolvedFolderId && folderUrl) {
      const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        resolvedFolderId = match[1];
      }
    }

    await db
      .update(offices)
      .set({
        googleDriveFolderUrl: folderUrl.trim(),
        googleDriveFolderId: resolvedFolderId || office.googleDriveFolderId,
        updatedAt: new Date(),
      })
      .where(eq(offices.id, office.id));

    revalidatePath('/configuracion');
    return { success: true, folderUrl, folderId: resolvedFolderId };
  } catch (error) {
    console.error('Error updating Google Drive folder:', error);
    return { success: false, error: 'No se pudo actualizar la carpeta.' };
  }
}

/**
 * Desconecta la cuenta de Google Drive del despacho
 */
export async function disconnectGoogleDriveAction(officeId?: string) {
  try {
    const office = await resolveOffice(officeId);
    if (!office) {
      return { success: false, error: 'Despacho no encontrado' };
    }

    await db
      .update(offices)
      .set({
        googleDriveConnected: false,
        googleDriveEmail: null,
        googleDriveAccessToken: null,
        googleDriveRefreshToken: null,
        googleDriveTokenExpiry: null,
        googleDriveFolderId: null,
        googleDriveFolderUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(offices.id, office.id));

    revalidatePath('/configuracion');
    revalidatePath('/gestiones');
    return { success: true, message: 'Google Drive desconectado exitosamente.' };
  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    return { success: false, error: 'No se pudo desconectar Google Drive.' };
  }
}

/**
 * Crea automáticamente una subcarpeta en Google Drive para un expediente de Gestión Ciudadana
 */
export async function createGestionDriveFolderAction(
  gestionFolio: string,
  citizenName: string,
  officeId?: string
) {
  try {
    const drive = await getValidDriveTokenForOffice(officeId);
    if (!drive || !drive.rootFolderId) {
      return { success: false, error: 'Google Drive no está vinculado o no tiene carpeta raíz' };
    }

    const subfolderName = `${gestionFolio} - ${citizenName.trim()}`;
    const folder = await createDriveSubfolder(drive.accessToken, drive.rootFolderId, subfolderName);

    if (!folder) {
      return { success: false, error: 'No se pudo crear la subcarpeta en Drive' };
    }

    return {
      success: true,
      folderId: folder.folderId,
      folderUrl: folder.folderUrl,
    };
  } catch (error: any) {
    console.error('Error creating gestion Drive folder:', error);
    return { success: false, error: error?.message || 'Error al crear carpeta en Google Drive' };
  }
}

/**
 * Asegura que una gestión tenga su carpeta correspondiente en Google Drive con su folio
 */
export async function ensureGestionDriveFolderAction(gestionId: string, officeId?: string) {
  try {
    const [gestion] = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (!gestion) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    const drive = await getValidDriveTokenForOffice(officeId || gestion.officeId);
    if (!drive || !drive.rootFolderId) {
      return {
        success: false,
        connected: false,
        error: 'Google Drive no está conectado al despacho',
        folderUrl: gestion.driveFolderUrl || null,
      };
    }

    // Si ya tiene driveFolderUrl válido
    if (gestion.driveFolderUrl) {
      const folderId = extractDriveFolderId(gestion.driveFolderUrl);
      return {
        success: true,
        connected: true,
        folderUrl: gestion.driveFolderUrl,
        folderId,
        folderName: `${gestion.folio} - ${gestion.solicitante.trim()}`,
      };
    }

    // Crear la carpeta en Drive para este folio
    const subfolderName = `${gestion.folio} - ${gestion.solicitante.trim()}`;
    const folder = await createDriveSubfolder(drive.accessToken, drive.rootFolderId, subfolderName);

    if (!folder) {
      return { success: false, connected: true, error: 'No se pudo crear la subcarpeta en Drive' };
    }

    await db
      .update(gestiones)
      .set({
        driveFolderUrl: folder.folderUrl,
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestion.id));

    revalidatePath(`/gestiones/${gestion.id}`);
    revalidatePath('/gestiones');

    return {
      success: true,
      connected: true,
      folderUrl: folder.folderUrl,
      folderId: folder.folderId,
      folderName: subfolderName,
    };
  } catch (error: any) {
    console.error('Error ensuring gestion Drive folder:', error);
    return { success: false, error: error?.message || 'Error al verificar carpeta de Drive' };
  }
}

/**
 * Obtiene el expediente de Google Drive de una gestión (archivos, url, estado de conexión)
 */
export async function getGestionDriveExpedienteAction(gestionId: string, officeId?: string) {
  try {
    const [gestion] = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (!gestion) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    const driveStatus = await getGoogleDriveStatusAction(officeId || gestion.officeId);
    if (!driveStatus.connected) {
      // Documentos registrados localmente en la gestión
      let localDocs: any[] = [];
      if (gestion.documentos) {
        try {
          localDocs = typeof gestion.documentos === 'string' ? JSON.parse(gestion.documentos) : gestion.documentos;
        } catch {}
      }

      return {
        success: true,
        connected: false,
        email: '',
        folderUrl: gestion.driveFolderUrl || null,
        folderName: `${gestion.folio} - ${gestion.solicitante}`,
        files: localDocs,
      };
    }

    // Asegurar carpeta
    const ensured = await ensureGestionDriveFolderAction(gestionId, officeId);
    const drive = await getValidDriveTokenForOffice(officeId || gestion.officeId);

    let driveFiles: any[] = [];
    if (ensured.folderId && drive?.accessToken) {
      const fetched = await listFilesInDriveFolder(drive.accessToken, ensured.folderId);
      driveFiles = fetched.map((f) => ({
        id: f.id,
        nombre: f.name,
        tipo: f.mimeType,
        tamano: f.size ? `${(Number(f.size) / (1024 * 1024)).toFixed(2)} MB` : 'Archivo',
        fecha: f.createdTime ? new Date(f.createdTime).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoy',
        urlDrive: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        webContentLink: f.webContentLink,
        source: 'google-drive',
      }));
    }

    // También incluir documentos en gestion.documentos si no están en driveFiles
    let dbDocs: any[] = [];
    if (gestion.documentos) {
      try {
        dbDocs = typeof gestion.documentos === 'string' ? JSON.parse(gestion.documentos) : gestion.documentos;
      } catch {}
    }

    const combined = [...driveFiles];
    for (const d of dbDocs) {
      if (!combined.some(f => f.nombre === d.nombre || f.id === d.id)) {
        combined.push(d);
      }
    }

    return {
      success: true,
      connected: true,
      email: driveStatus.email,
      folderUrl: ensured.folderUrl || gestion.driveFolderUrl,
      folderId: ensured.folderId,
      folderName: `${gestion.folio} - ${gestion.solicitante}`,
      files: combined,
    };
  } catch (error: any) {
    console.error('Error fetching gestion drive expediente:', error);
    return { success: false, error: error?.message || 'Error al consultar expediente de Drive' };
  }
}

/**
 * Sube un documento al expediente de una gestión directamente en su carpeta de Google Drive
 */
export async function uploadDocumentToGestionDriveAction(gestionId: string, formData: FormData, officeId?: string) {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No se subió ningún archivo' };
    }

    const [gestion] = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (!gestion) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    const drive = await getValidDriveTokenForOffice(officeId || gestion.officeId);
    if (!drive || !drive.rootFolderId) {
      return { success: false, connected: false, error: 'Google Drive no está conectado al despacho' };
    }

    const ensured = await ensureGestionDriveFolderAction(gestionId, officeId);
    if (!ensured.success || !ensured.folderId) {
      return { success: false, error: ensured.error || 'No se pudo crear o localizar la carpeta de Drive' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadFileToDriveFolder(
      drive.accessToken,
      ensured.folderId,
      file.name,
      file.type,
      buffer
    );

    if (!uploaded) {
      return { success: false, error: 'No se pudo subir el archivo a Google Drive' };
    }

    // Actualizar documentos en base de datos
    let currentDocs: any[] = [];
    if (gestion.documentos) {
      try {
        currentDocs = typeof gestion.documentos === 'string' ? JSON.parse(gestion.documentos) : gestion.documentos;
      } catch {}
    }

    const newDoc = {
      id: uploaded.fileId,
      nombre: file.name,
      tipo: file.type || 'Documento',
      fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      tamano: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      urlDrive: uploaded.webViewLink,
      webContentLink: uploaded.webContentLink,
      source: 'google-drive',
    };

    currentDocs.unshift(newDoc);

    await db
      .update(gestiones)
      .set({
        documentos: JSON.stringify(currentDocs),
        driveFolderUrl: ensured.folderUrl || gestion.driveFolderUrl,
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestion.id));

    revalidatePath(`/gestiones/${gestion.id}`);
    revalidatePath('/gestiones');

    return {
      success: true,
      connected: true,
      file: newDoc,
      folderUrl: ensured.folderUrl,
    };
  } catch (error: any) {
    console.error('Error uploading document to Drive:', error);
    return { success: false, error: error?.message || 'Error al procesar subida de archivo a Drive' };
  }
}

/**
 * Elimina un documento del expediente de una gestión tanto de Google Drive como de la base de datos
 */
export async function deleteDocumentFromGestionDriveAction(
  gestionId: string,
  fileId: string,
  fileName?: string,
  usuarioActual?: string,
  officeId?: string
) {
  try {
    const [gestion] = await db
      .select()
      .from(gestiones)
      .where(eq(gestiones.id, gestionId))
      .limit(1);

    if (!gestion) {
      return { success: false, error: 'Gestión no encontrada' };
    }

    // 1. Intentar eliminar de Google Drive si cuenta con token y fileId válido
    try {
      const drive = await getValidDriveTokenForOffice(officeId || gestion.officeId);
      if (drive?.accessToken && fileId && fileId.length > 5) {
        await deleteFileFromDrive(drive.accessToken, fileId);
      }
    } catch (dErr) {
      console.warn('Could not delete file directly from Google Drive:', dErr);
    }

    // 2. Actualizar lista de documentos en la BD
    let currentDocs: any[] = [];
    if (gestion.documentos) {
      try {
        currentDocs = typeof gestion.documentos === 'string' ? JSON.parse(gestion.documentos) : gestion.documentos;
        if (!Array.isArray(currentDocs)) currentDocs = [];
      } catch {
        currentDocs = [];
      }
    }

    const updatedDocs = currentDocs.filter(
      (d: any) => d.id !== fileId && d.nombre !== fileName
    );

    // 3. Registrar en el historial de actualización
    const { meta } = appendHistorialToMeta(gestion.notasInternas, {
      usuario: usuarioActual || 'Usuario del Despacho',
      accion: `eliminó el archivo "${fileName || 'documento'}" del expediente.`,
      tipo: 'documento',
    });

    await db
      .update(gestiones)
      .set({
        documentos: JSON.stringify(updatedDocs),
        notasInternas: JSON.stringify(meta),
        updatedAt: new Date(),
      })
      .where(eq(gestiones.id, gestion.id));

    revalidatePath(`/gestiones/${gestion.id}`);
    revalidatePath('/gestiones');

    return { success: true, message: 'Archivo eliminado correctamente' };
  } catch (error: any) {
    console.error('Error deleting document from gestion:', error);
    return { success: false, error: error?.message || 'No se pudo eliminar el archivo' };
  }
}


