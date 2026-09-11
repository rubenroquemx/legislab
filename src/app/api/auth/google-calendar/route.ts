import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthUrl, getAppBaseUrl } from '@/lib/google-calendar';
import { getActiveOfficeId } from '@/lib/session-office';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/google-calendar/callback`;
    
    const paramOfficeId = request.nextUrl.searchParams.get('officeId');
    const officeId = await getActiveOfficeId(paramOfficeId);
    
    const authUrl = getGoogleOAuthUrl(redirectUri, officeId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Calendar OAuth URL:', error);
    const origin = getAppBaseUrl(request);
    return NextResponse.redirect(new URL('/agenda?gcal_error=oauth_init_failed', origin));
  }
}
