import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForDriveTokens, getOrCreateRootDriveFolder, getAppBaseUrl } from '@/lib/google-drive';
import { db, offices } from '@/db';
import { eq } from 'drizzle-orm';
import { getActiveOfficeId } from '@/lib/session-office';

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
    const targetOfficeId = await getActiveOfficeId(state);
    const expiryDate = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000);

    let [targetOffice] = await db.select().from(offices).where(eq(offices.id, targetOfficeId)).limit(1);

    const folderName = targetOffice?.name ? `LegisLab - ${targetOffice.name}` : 'LegisLab - Despacho Parlamentario';

    // Obtener o crear carpeta raíz en Google Drive
    let rootFolder = { folderId: '', folderUrl: '' };
    try {
      rootFolder = await getOrCreateRootDriveFolder(tokens.accessToken, folderName);
    } catch (fErr) {
      console.warn('Could not create root Drive folder automatically:', fErr);
    }

    if (targetOffice) {
      await db
        .update(offices)
        .set({
          googleDriveConnected: true,
          googleDriveEmail: tokens.email || 'Conectado',
          googleDriveAccessToken: tokens.accessToken,
          googleDriveRefreshToken: tokens.refreshToken || targetOffice.googleDriveRefreshToken || null,
          googleDriveTokenExpiry: expiryDate,
          googleDriveFolderId: rootFolder.folderId || targetOffice.googleDriveFolderId || null,
          googleDriveFolderUrl: rootFolder.folderUrl || targetOffice.googleDriveFolderUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(offices.id, targetOffice.id));
    }

    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gdrive_status=connected', origin));
  } catch (err: any) {
    console.error('Error exchanging Google Drive code:', err);
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&gdrive_error=${encodeURIComponent(err?.message || 'exchange_failed')}`, origin)
    );
  }
}
