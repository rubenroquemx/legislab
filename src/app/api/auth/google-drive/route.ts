import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveOAuthUrl, getAppBaseUrl } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/google-drive/callback`;
    
    const officeId = request.nextUrl.searchParams.get('officeId') || '00000000-0000-0000-0000-000000000001';
    
    const authUrl = getGoogleDriveOAuthUrl(redirectUri, officeId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Drive OAuth URL:', error);
    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gdrive_error=oauth_init_failed', request.url));
  }
}
