/**
 * Google Drive API (v3) & OAuth 2.0 Integration Client
 */

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

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
