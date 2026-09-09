import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getAppBaseUrl } from '@/lib/google-calendar';
import { db, offices } from '@/db';
import { eq } from 'drizzle-orm';

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
    const officeId = state || '00000000-0000-0000-0000-000000000001';

    const expiryDate = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000);

    let targetOffice = (await db.select().from(offices).where(eq(offices.id, officeId)))[0];
    if (!targetOffice) {
      targetOffice = (await db.select().from(offices).limit(1))[0];
    }

    try {
      if (!targetOffice) {
        const [inserted] = await db.insert(offices).values({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Despacho Parlamentario Dip. Ruben Roque',
          titularName: 'Dip. Ruben Roque',
          legislature: 'LXVI Legislatura',
          district: 'Distrito 04 Federal',
          state: 'Tabasco',
          party: 'MORENA',
          googleCalendarConnected: true,
          googleCalendarEmail: tokens.email || 'Conectado',
          googleCalendarAccessToken: tokens.accessToken,
          googleCalendarRefreshToken: tokens.refreshToken || null,
          googleCalendarTokenExpiry: expiryDate,
          googleCalendarId: 'primary',
          googleCalendarLastSync: new Date(),
        }).returning();
        targetOffice = inserted;
      } else {
        await db
          .update(offices)
          .set({
            googleCalendarConnected: true,
            googleCalendarEmail: tokens.email || 'Conectado',
            googleCalendarAccessToken: tokens.accessToken,
            googleCalendarRefreshToken: tokens.refreshToken || null,
            googleCalendarTokenExpiry: expiryDate,
            googleCalendarId: 'primary',
            googleCalendarLastSync: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(offices.id, targetOffice.id));
      }
    } catch (dbErr) {
      console.warn('Database save warning during Google Calendar callback:', dbErr);
    }

    return NextResponse.redirect(new URL('/configuracion?tab=conexiones&gcal_status=connected', origin));
  } catch (err: any) {
    console.error('Error exchanging Google Calendar code:', err);
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&gcal_error=${encodeURIComponent(err?.message || 'exchange_failed')}`, origin)
    );
  }
}
