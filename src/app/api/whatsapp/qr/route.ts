import { NextRequest, NextResponse } from 'next/server';
import { generateWhatsAppQR } from '@/app/actions/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const instanceName = request.nextUrl.searchParams.get('instanceName') || 'Legislab';
    const result = await generateWhatsAppQR(instanceName);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
