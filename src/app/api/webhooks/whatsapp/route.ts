import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { atencionMensajes } from '@/db/schema';
import { getFirstOfficeId } from '@/app/actions/gestiones';

/**
 * Evolution API Webhook Receiver
 * Handles incoming WhatsApp messages and connection updates
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || body.type;
    const data = body.data || body;

    // 1. New Incoming Message
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const msg = data.message || data;
      const key = msg.key || {};

      // Ignore messages sent by ourselves
      if (key.fromMe) {
        return NextResponse.json({ status: 'ignored_from_me' });
      }

      const remoteJid = key.remoteJid || '';
      // Only process direct citizen messages (ignore @g.us group broadcast flood if desired)
      const isGroup = remoteJid.endsWith('@g.us');
      const senderPhone = remoteJid.split('@')[0];
      const pushName = data.pushName || msg.pushName || `Ciudadano +${senderPhone}`;

      // Extract text content from various WhatsApp message types
      const text =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        (msg.audioMessage ? '🎤 Mensaje de voz de WhatsApp' : '') ||
        '📄 Archivo adjunto recibido';

      if (text && senderPhone) {
        const officeId = await getFirstOfficeId();
        const now = new Date();
        const horaStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        await db.insert(atencionMensajes).values({
          officeId,
          ciudadanoNombre: pushName,
          ciudadanoTelefono: `+${senderPhone}`,
          ultimoMensaje: text,
          horaUltimoMensaje: horaStr,
          colonia: isGroup ? 'Grupo WhatsApp' : 'Directo',
          estatus: 'Pendiente',
          sinLeer: true,
        });
      }
    }

    return NextResponse.json({ status: 'received' });
  } catch (err: unknown) {
    console.error('Error in WhatsApp webhook:', err);
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'LegisLab Evolution API WhatsApp Webhook',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
}
