'use server';

import { db, offices } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { refreshDriveAccessToken, createDriveSubfolder } from '@/lib/google-drive';
import { getActiveOfficeId } from '@/lib/session-office';

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

    return {
      accessToken: currentAccessToken,
      rootFolderId: office.googleDriveFolderId,
      rootFolderUrl: office.googleDriveFolderUrl,
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
