/**
 * Google Drive API (v3) & OAuth 2.0 Integration Client
 */

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Retorna la URL base pública de la aplicación detectando variables de entorno o proxies
 */
export function getAppBaseUrl(request?: { nextUrl?: { origin: string }; headers?: { get: (name: string) => string | null } }): string {
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('0.0.0.0')) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (process.env.APP_URL && !process.env.APP_URL.includes('0.0.0.0')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('0.0.0.0')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  if (request) {
    const forwardedHost = request.headers?.get('x-forwarded-host') || request.headers?.get('host');
    const forwardedProto = request.headers?.get('x-forwarded-proto') || 'https';
    if (forwardedHost && !forwardedHost.includes('0.0.0.0')) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    const origin = request.nextUrl?.origin;
    if (origin && !origin.includes('0.0.0.0')) {
      return origin;
    }
  }

  return 'https://legislab.app';
}

/**
 * Retorna las credenciales de cliente OAuth configuradas en variables de entorno
 */
export function getGoogleOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  return { clientId, clientSecret };
}

/**
 * Genera la URL de autorización para Google Drive
 */
export function getGoogleDriveOAuthUrl(redirectUri: string, state: string = 'drive_sync'): string {
  const { clientId } = getGoogleOAuthCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_DRIVE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Canjea el código de autorización por tokens de acceso y refresco para Drive
 */
export async function exchangeCodeForDriveTokens(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  email?: string;
  name?: string;
}> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en canje de código Google Drive: ${errText}`);
  }

  const tokenData = await res.json();

  let email = '';
  let name = '';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      email = userData.email || '';
      name = userData.name || '';
    }
  } catch (e) {
    console.warn('No se pudo obtener el perfil de Google Drive:', e);
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in || 3600,
    email,
    name,
  };
}

/**
 * Refresca un token de acceso expirado para Drive
 */
export async function refreshDriveAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al refrescar token de Google Drive: ${errText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Obtiene o crea la carpeta raíz principal de LegisLab en el Google Drive del usuario
 */
export async function getOrCreateRootDriveFolder(
  accessToken: string,
  folderName: string = 'LegisLab - Despacho Parlamentario'
): Promise<{ folderId: string; folderUrl: string }> {
  try {
    // 1. Buscar si ya existe la carpeta con este nombre
    const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existing = searchData.files[0];
        return {
          folderId: existing.id,
          folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
        };
      }
    }

    // 2. Si no existe, crear la carpeta raíz
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Carpeta central de expedientes, gestiones e iniciativas de LegisLab',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`No se pudo crear la carpeta raíz en Drive: ${err}`);
    }

    const created = await createRes.json();
    return {
      folderId: created.id,
      folderUrl: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
    };
  } catch (error) {
    console.error('Error in getOrCreateRootDriveFolder:', error);
    throw error;
  }
}

/**
 * Crea una subcarpeta dentro de una carpeta padre (ej: subcarpeta para una Gestión ciudadana o Iniciativa)
 */
export async function createDriveSubfolder(
  accessToken: string,
  parentFolderId: string,
  subfolderName: string
): Promise<{ folderId: string; folderUrl: string } | null> {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Error creating subfolder in Drive:', err);
      return null;
    }

    const data = await res.json();
    return {
      folderId: data.id,
      folderUrl: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`,
    };
  } catch (error) {
    console.error('Error in createDriveSubfolder:', error);
    return null;
  }
}

/**
 * Extrae el ID de una carpeta de Google Drive a partir de una URL o identificador
 */
export function extractDriveFolderId(folderUrl?: string | null): string | null {
  if (!folderUrl) return null;
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(folderUrl.trim())) return folderUrl.trim();
  return null;
}

/**
 * Lista los archivos contenidos dentro de una carpeta de Google Drive
 */
export async function listFilesInDriveFolder(
  accessToken: string,
  folderId: string
): Promise<Array<{
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
}>> {
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,webViewLink,webContentLink,iconLink,thumbnailLink,createdTime)&orderBy=createdTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.warn('Error listing files in Drive folder:', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error in listFilesInDriveFolder:', error);
    return [];
  }
}

/**
 * Sube un archivo directamente a una carpeta de Google Drive usando la API REST v3 multipart
 */
export async function uploadFileToDriveFolder(
  accessToken: string,
  parentFolderId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<{
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
} | null> {
  try {
    const boundary = '-------LegisLabDriveUploadBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [parentFolderId],
      mimeType: mimeType || 'application/octet-stream',
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType || 'application/octet-stream'}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n'
      ),
      Buffer.from(fileBuffer.toString('base64')),
      Buffer.from(closeDelimiter)
    ]);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString(),
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Error uploading file to Drive:', err);
      return null;
    }

    const data = await res.json();
    return {
      fileId: data.id,
      fileName: data.name,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      webContentLink: data.webContentLink,
      size: data.size,
    };
  } catch (error) {
    console.error('Error in uploadFileToDriveFolder:', error);
    return null;
  }
}

/**
 * Elimina un archivo permanentemente de Google Drive mediante su ID
 */
export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 404) {
      console.warn('Error deleting file from Drive:', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFileFromDrive:', error);
    return false;
  }
}

