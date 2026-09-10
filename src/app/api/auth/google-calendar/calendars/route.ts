import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarsListAction, setGoogleCalendarIdAction } from '@/app/actions/agenda';

export async function GET(request: NextRequest) {
  try {
    const officeId = request.nextUrl.searchParams.get('officeId') || '00000000-0000-0000-0000-000000000001';
    const result = await getGoogleCalendarsListAction(officeId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al obtener calendarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const calendarId = body.calendarId || 'primary';
    const officeId = body.officeId || '00000000-0000-0000-0000-000000000001';
    const result = await setGoogleCalendarIdAction(calendarId, officeId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al guardar calendario' }, { status: 500 });
  }
}
