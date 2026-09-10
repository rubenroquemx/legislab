import { NextRequest, NextResponse } from 'next/server';
import { disconnectGoogleCalendarAction } from '@/app/actions/agenda';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const officeId = body.officeId || '00000000-0000-0000-0000-000000000001';
    const result = await disconnectGoogleCalendarAction(officeId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al desconectar Calendar' }, { status: 500 });
  }
}
