import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getAppBaseUrl } from '@/lib/google-calendar';
import { db, offices } from '@/db';
import { eq } from 'drizzle-orm';
import { getActiveOfficeId } from '@/lib/session-office';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // officeId

  const origin = getAppBaseUrl(request);
  const redirectUri = `${origin}/api/auth/google-calendar/callback`;

  if (error || !code) {
    console.warn('Google Calendar OAuth error:', error);
    return NextResponse.redirect(new URL(`/agenda?gcal_error=${encodeURIComponent(error || 'no_code')}`, origin));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const targetOfficeId = await getActiveOfficeId(state);
    const expiryDate = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000);

    let [targetOffice] = await db.select().from(offices).where(eq(offices.id, targetOfficeId)).limit(1);

    if (targetOffice) {
      await db
        .update(offices)
        .set({
          googleCalendarConnected: true,
          googleCalendarEmail: tokens.email || 'Conectado',
          googleCalendarAccessToken: tokens.accessToken,
          googleCalendarRefreshToken: tokens.refreshToken || targetOffice.googleCalendarRefreshToken || null,
          googleCalendarTokenExpiry: expiryDate,
          googleCalendarId: targetOffice.googleCalendarId || 'primary',
          googleCalendarLastSync: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(offices.id, targetOffice.id));
    }

    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gcal_status=connected', origin));
  } catch (err: any) {
    console.error('Error exchanging Google Calendar code:', err);
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&gcal_error=${encodeURIComponent(err?.message || 'exchange_failed')}`, origin)
    );
  }
}
