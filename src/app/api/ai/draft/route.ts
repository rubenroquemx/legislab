import { NextRequest, NextResponse } from 'next/server';
import { generateLegislativeDraftStream } from '@/lib/ai/client';
import { saveIaGeneration } from '@/app/actions/gestiones';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, tipoDocumento, ambito, comision, officeId } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'El campo "prompt" es obligatorio' }, { status: 400 });
    }

    const generator = generateLegislativeDraftStream({
      prompt,
      tipoDocumento: tipoDocumento || 'Iniciativa de Ley',
      ambito: ambito || 'Federal (Cámara de Diputados)',
      comision,
    });

    const encoder = new TextEncoder();
    let completeGeneratedText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            completeGeneratedText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();

          // Guardar registro de la generación en segundo plano
          try {
            await saveIaGeneration({
              prompt,
              tipoDocumento: tipoDocumento || 'Iniciativa de Ley',
              ambito: ambito || 'Federal (Cámara de Diputados)',
              generatedText: completeGeneratedText,
              officeId,
            });
          } catch (e) {
            console.error('Error logging IA generation to DB:', e);
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in /api/ai/draft route:', error);
    return NextResponse.json({ error: 'Error interno en el generador de IA' }, { status: 500 });
  }
}