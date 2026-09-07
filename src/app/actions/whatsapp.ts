'use server';

import {
  createInstance,
  connectInstance,
  getConnectionState,
  logoutInstance,
  sendTextMessage,
  fetchAllGroups,
  fetchAllChats,
  formatPhoneForWhatsApp,
  type WhatsAppGroup,
  type WhatsAppChat,
} from '@/lib/evolution-api';
import { db } from '@/db';
import { gruposContactos, grupoMiembros, atencionMensajes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getFirstOfficeId } from './gestiones';

const DEFAULT_INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || 'Legislab';

/**
 * Checks connection state with Evolution API
 */
export async function getWhatsAppStatus(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const res = await getConnectionState(instanceName);
    if (res.success && res.data) {
      const state = res.data.instance?.state || 'close';
      return {
        success: true,
        isConnected: state === 'open',
        state,
        instanceName,
      };
    }
    return {
      success: false,
      isConnected: false,
      state: 'close',
      instanceName,
      error: res.error || 'No se pudo consultar el estado de Evolution API',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      isConnected: false,
      state: 'close',
      instanceName,
      error: msg,
    };
  }
}

/**
 * Requests or regenerates the WhatsApp QR code from Evolution API
 */
export async function generateWhatsAppQR(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    let connectRes = await connectInstance(instanceName);

    if (!connectRes.success && (connectRes.status === 404 || connectRes.error?.toLowerCase().includes('not found') || connectRes.error?.toLowerCase().includes('não encontrada'))) {
      const createRes = await createInstance(instanceName);
      if (!createRes.success) {
        return {
          success: false,
          error: createRes.error || 'Error al crear la instancia en Evolution API',
        };
      }
      connectRes = await connectInstance(instanceName);
    }

    if (connectRes.success && connectRes.data) {
      return {
        success: true,
        qrCode: connectRes.data.code,
        qrBase64: connectRes.data.base64,
        pairingCode: connectRes.data.pairingCode,
        instanceName,
      };
    }

    return {
      success: false,
      error: connectRes.error || 'No se pudo obtener el código QR de Evolution API',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Disconnects / logs out the WhatsApp instance
 */
export async function disconnectWhatsApp(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const res = await logoutInstance(instanceName);
    return {
      success: res.success,
      error: res.error,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Sends a real WhatsApp message to a phone number via Evolution API
 */
export async function sendWhatsAppMessageAction(params: {
  to: string;
  text: string;
  instanceName?: string;
}) {
  const instanceName = params.instanceName || DEFAULT_INSTANCE_NAME;
  try {
    const res = await sendTextMessage(instanceName, params.to, params.text);
    return {
      success: res.success,
      data: res.data,
      error: res.error,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Consulta y sincroniza en vivo los grupos de WhatsApp desde Evolution API
 */
export async function syncWhatsAppGroups(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const res = await fetchAllGroups(instanceName, true);
    if (!res.success || !res.data) {
      return {
        success: false,
        error: res.error || 'No se pudieron consultar los grupos en Evolution API. Verifica que WhatsApp esté conectado.',
        data: [],
      };
    }

    const groups = res.data;
    const officeId = await getFirstOfficeId();
    const mappedGroups = [];

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const gId = g.id || g.jid || g.JID || `grp-${i}`;
      const gName = g.subject || g.name || `Grupo WhatsApp ${i + 1}`;
      const participants = g.participants || [];

      // Save / update in database if possible
      try {
        const existing = await db
          .select()
          .from(gruposContactos)
          .where(eq(gruposContactos.nombre, gName))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(gruposContactos).values({
            officeId,
            nombre: gName,
            categoria: 'Comunitario',
            color: 'emerald',
            whatsappLink: `https://chat.whatsapp.com/${gId.split('@')[0]}`,
          });
        }
      } catch (dbErr) {
        console.warn('DB group sync cache skipped:', dbErr);
      }

      mappedGroups.push({
        id: gId,
        nombre: gName,
        descripcion: g.desc || `Grupo sincronizado desde WhatsApp (${participants.length || g.size || 1} participantes)`,
        categoria: 'Comunitario' as const,
        color: 'emerald' as const,
        whatsappLink: `https://chat.whatsapp.com/${gId.split('@')[0]}`,
        totalMiembros: participants.length || g.size || 1,
        ultimaActividad: 'Sincronizado en vivo',
        creadoEnWhatsapp: true,
        miembros: participants.slice(0, 20).map((p, pIdx) => {
          const rawPhone = (p.id || p.jid || '').split('@')[0] || `993${pIdx}00000`;
          return {
            id: `m-${pIdx}`,
            nombre: `Participante +${rawPhone}`,
            cargo: p.admin ? 'Administrador' : 'Integrante',
            telefono: `+${rawPhone}`,
            municipio: 'Centro',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          };
        }),
      });
    }

    return {
      success: true,
      totalGrupos: mappedGroups.length,
      data: mappedGroups,
      message: `¡Sincronización exitosa! Se cargaron ${mappedGroups.length} grupos desde WhatsApp.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Error durante la sincronización: ${msg}`,
      data: [],
    };
  }
}

/**
 * Consulta las conversaciones reales para Atención Ciudadana
 */
export async function getWhatsAppConversacionesAction(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const officeId = await getFirstOfficeId();

    // 1. Check database first
    let dbMsgs: any[] = [];
    try {
      dbMsgs = await db
        .select()
        .from(atencionMensajes)
        .where(eq(atencionMensajes.officeId, officeId))
        .orderBy(desc(atencionMensajes.createdAt));
    } catch (e) {
      console.warn('DB atencion mensajes read:', e);
    }

    // 2. Query Evolution API for recent chats
    const chatsRes = await fetchAllChats(instanceName);
    const chats = chatsRes.success && chatsRes.data ? chatsRes.data : [];

    const mappedConversaciones = [];

    // Map DB messages
    if (dbMsgs.length > 0) {
      for (const m of dbMsgs) {
        mappedConversaciones.push({
          id: m.id,
          ciudadanoNombre: m.ciudadanoNombre,
          ciudadanoTelefono: m.ciudadanoTelefono,
          ciudadanoAvatar: m.ciudadanoFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          municipio: 'Centro',
          colonia: m.colonia || 'Centro',
          ultimoMensaje: m.ultimoMensaje,
          ultimaHora: m.horaUltimoMensaje || 'Reciente',
          noLeidos: m.sinLeer ? 1 : 0,
          categoria: 'Gestión Médica' as const,
          estado: 'sin_asignar' as const,
          asignadoA: null,
          mensajes: [
            {
              id: `msg-${m.id}`,
              autor: 'ciudadano' as const,
              nombreAutor: m.ciudadanoNombre,
              texto: m.ultimoMensaje,
              hora: m.horaUltimoMensaje || 'Hoy',
              fecha: 'Hoy',
            },
          ],
        });
      }
    }

    // Map Evolution API direct chats
    if (chats.length > 0) {
      for (const c of chats) {
        const jid = c.id || c.jid || '';
        if (jid.endsWith('@g.us')) continue; // skip group broadcasts in citizen inbox

        const phone = jid.split('@')[0];
        const name = c.pushName || c.name || `Ciudadano +${phone}`;
        const lastMsgText = c.lastMessage?.message ? Object.values(c.lastMessage.message)[0] : 'Conversación iniciada';
        const textStr = typeof lastMsgText === 'string' ? lastMsgText : 'Mensaje recibido';

        // Check if not already mapped from DB
        if (!mappedConversaciones.some(m => m.ciudadanoTelefono.includes(phone))) {
          mappedConversaciones.push({
            id: `chat-${phone}`,
            ciudadanoNombre: name,
            ciudadanoTelefono: `+${phone}`,
            ciudadanoAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            municipio: 'Centro',
            colonia: 'WhatsApp Directo',
            ultimoMensaje: textStr,
            ultimaHora: 'Reciente',
            noLeidos: c.unreadCount || 0,
            categoria: 'Gestión Médica' as const,
            estado: 'sin_asignar' as const,
            asignadoA: null,
            mensajes: [
              {
                id: `msg-${phone}`,
                autor: 'ciudadano' as const,
                nombreAutor: name,
                texto: textStr,
                hora: 'Hoy',
                fecha: 'Hoy',
              },
            ],
          });
        }
      }
    }

    return {
      success: true,
      data: mappedConversaciones,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: [],
    };
  }
}
