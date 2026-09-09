import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthUrl, getAppBaseUrl } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/google-calendar/callback`;
    
    // Obtener officeId o usuario de params o cookies si existe
    const officeId = request.nextUrl.searchParams.get('officeId') || '00000000-0000-0000-0000-000000000001';
    
    const authUrl = getGoogleOAuthUrl(redirectUri, officeId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Calendar OAuth URL:', error);
    return NextResponse.redirect(new URL('/agenda?gcal_error=oauth_init_failed', request.url));
  }
}
