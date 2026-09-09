import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForDriveTokens, getOrCreateRootDriveFolder, getAppBaseUrl } from '@/lib/google-drive';
import { db, offices } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // officeId

  const origin = getAppBaseUrl(request);
  const redirectUri = `${origin}/api/auth/google-drive/callback`;

  if (error || !code) {
    console.warn('Google Drive OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&gdrive_error=${encodeURIComponent(error || 'no_code')}`, origin)
    );
  }

  try {
    const tokens = await exchangeCodeForDriveTokens(code, redirectUri);
    const officeId = state || '00000000-0000-0000-0000-000000000001';
    const expiryDate = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000);

    // Obtener o crear carpeta raíz en Google Drive
    let rootFolder = { folderId: '', folderUrl: '' };
    try {
      rootFolder = await getOrCreateRootDriveFolder(tokens.accessToken, 'LegisLab - Despacho Parlamentario');
    } catch (fErr) {
      console.warn('Could not create root Drive folder automatically:', fErr);
    }

    try {
      await db
        .update(offices)
        .set({
          googleDriveConnected: true,
          googleDriveEmail: tokens.email || 'Conectado',
          googleDriveAccessToken: tokens.accessToken,
          googleDriveRefreshToken: tokens.refreshToken || null,
          googleDriveTokenExpiry: expiryDate,
          googleDriveFolderId: rootFolder.folderId || null,
          googleDriveFolderUrl: rootFolder.folderUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(offices.id, officeId));
    } catch (dbErr) {
      console.warn('Database save warning during Google Drive callback:', dbErr);
    }

    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gdrive_status=connected', origin));
  } catch (err: any) {
    console.error('Error exchanging Google Drive code:', err);
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&gdrive_error=${encodeURIComponent(err?.message || 'exchange_failed')}`, origin)
    );
  }
}
