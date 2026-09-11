import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveOAuthUrl, getAppBaseUrl } from '@/lib/google-drive';
import { getActiveOfficeId } from '@/lib/session-office';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/google-drive/callback`;
    
    const paramOfficeId = request.nextUrl.searchParams.get('officeId');
    const officeId = await getActiveOfficeId(paramOfficeId);
    
    const authUrl = getGoogleDriveOAuthUrl(redirectUri, officeId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Drive OAuth URL:', error);
    const origin = getAppBaseUrl(request);
    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gdrive_error=oauth_init_failed', origin));
  }
}
