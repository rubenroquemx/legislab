import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppStatus, getWhatsAppInstanceInfo } from '@/app/actions/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const instanceName = request.nextUrl.searchParams.get('instanceName') || 'Legislab';
    const statusRes = await getWhatsAppStatus(instanceName);
    let info = null;
    if (statusRes.isConnected) {
      const infoRes = await getWhatsAppInstanceInfo(instanceName);
      info = infoRes.data || null;
    }
    return NextResponse.json({ ...statusRes, info });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
