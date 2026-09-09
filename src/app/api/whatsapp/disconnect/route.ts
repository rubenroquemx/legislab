import { NextRequest, NextResponse } from 'next/server';
import { disconnectWhatsApp } from '@/app/actions/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const instanceName = body.instanceName || 'Legislab';
    const result = await disconnectWhatsApp(instanceName);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
