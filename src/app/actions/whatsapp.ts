'use server';

import {
  createInstance,
  connectInstance,
  getConnectionState,
  logoutInstance,
  sendTextMessage,
  fetchAllGroups,
  fetchAllChats,
  fetchAllContacts,
  fetchInstances,
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
 * Gets detailed instance info (connected phone, profile name, counts)
 */
export async function getWhatsAppInstanceInfo(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const res = await fetchInstances();
    if (res.success && res.data) {
      const instances = res.data as any[];
      const inst = instances.find((i: any) => (i.name || i.instance?.instanceName) === instanceName);
      if (inst) {
        const ownerJid = inst.ownerJid || '';
        const phone = ownerJid.split('@')[0] || '';
        // Format phone: 5219932200146 -> +52 (993) 220-0146
        let formattedPhone = phone;
        if (phone.startsWith('521') && phone.length >= 13) {
          const area = phone.substring(3, 6);
          const p1 = phone.substring(6, 9);
          const p2 = phone.substring(9, 13);
          formattedPhone = `+52 (${area}) ${p1}-${p2}`;
        } else if (phone.length > 5) {
          formattedPhone = `+${phone}`;
        }
        
        return {
          success: true,
          data: {
            instanceName: inst.name || instanceName,
            connectionStatus: inst.connectionStatus || 'close',
            phone: formattedPhone,
            rawPhone: phone,
            profileName: inst.profileName || 'Sin nombre',
            profilePicUrl: inst.profilePicUrl || null,
            messageCount: inst._count?.Message || 0,
            contactCount: inst._count?.Contact || 0,
            chatCount: inst._count?.Chat || 0,
          },
        };
      }
    }
    return { success: false, error: 'Instancia no encontrada', data: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, data: null };
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

    // 2. Query Evolution API for recent chats & contacts in parallel
    const [chatsRes, contactsRes] = await Promise.all([
      fetchAllChats(instanceName),
      fetchAllContacts(instanceName),
    ]);

    const chats = chatsRes.success && chatsRes.data ? chatsRes.data : [];
    const contacts = contactsRes.success && contactsRes.data ? contactsRes.data : [];

    // Build contacts lookup dictionary
    const contactsMap = new Map<string, { pushName?: string; profilePicUrl?: string }>();
    for (const ct of contacts) {
      const cJid = ct.remoteJid || ct.id || '';
      if (!cJid || cJid.endsWith('@g.us')) continue;
      const cPhone = cJid.split('@')[0];
      const info = {
        pushName: ct.pushName && ct.pushName !== 'Você' && ct.pushName !== 'You' ? ct.pushName : undefined,
        profilePicUrl: ct.profilePicUrl || undefined,
      };
      contactsMap.set(cJid, info);
      contactsMap.set(cPhone, info);
      if (cPhone.startsWith('521') && cPhone.length === 13) {
        contactsMap.set(`52${cPhone.substring(3)}`, info);
        contactsMap.set(cPhone.substring(3), info);
      }
    }

    const mappedConversaciones = [];

    // Map DB messages
    if (dbMsgs.length > 0) {
      for (const m of dbMsgs) {
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.ciudadanoNombre)}&background=2563eb&color=fff&bold=true`;
        mappedConversaciones.push({
          id: m.id,
          ciudadanoNombre: m.ciudadanoNombre,
          ciudadanoTelefono: m.ciudadanoTelefono,
          ciudadanoAvatar: m.ciudadanoFoto || fallbackAvatar,
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
        const jid = c.remoteJid || c.id || c.jid || '';
        if (jid.endsWith('@g.us')) continue; // skip group broadcasts in citizen inbox
        if (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid')) continue; // only personal chats

        const phone = jid.split('@')[0];
        const contactInfo = contactsMap.get(jid) || contactsMap.get(phone);

        let name = contactInfo?.pushName || '';
        if (!name && c.pushName && c.pushName !== 'Você' && c.pushName !== 'You') {
          name = c.pushName;
        }
        if (!name && c.lastMessage?.pushName && c.lastMessage.pushName !== 'Você' && c.lastMessage.pushName !== 'You') {
          name = c.lastMessage.pushName;
        }
        if (!name && c.name && c.name !== 'Você') {
          name = c.name;
        }

        // Format phone nicely for display if name is still missing
        let displayPhone = phone;
        if (phone.startsWith('521') && phone.length === 13) {
          const area = phone.substring(3, 6);
          const p1 = phone.substring(6, 9);
          const p2 = phone.substring(9, 13);
          displayPhone = `+52 (${area}) ${p1}-${p2}`;
        } else if (phone.startsWith('52') && phone.length === 12) {
          const area = phone.substring(2, 5);
          const p1 = phone.substring(5, 8);
          const p2 = phone.substring(8, 12);
          displayPhone = `+52 (${area}) ${p1}-${p2}`;
        } else {
          displayPhone = `+${phone}`;
        }

        if (!name) {
          name = displayPhone;
        }

        // Avatar
        const avatarUrl = contactInfo?.profilePicUrl || c.profilePicUrl || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/[^a-zA-Z0-9 ]/g, ''))}&background=2563eb&color=fff&bold=true`;
        
        // Extract last message text cleanly
        let textStr = 'Conversación iniciada';
        if (c.lastMessage?.message) {
          const msgObj = c.lastMessage.message;
          if (typeof msgObj.conversation === 'string' && msgObj.conversation.trim()) {
            textStr = msgObj.conversation;
          } else if (msgObj.extendedTextMessage && typeof msgObj.extendedTextMessage === 'object' && 'text' in (msgObj.extendedTextMessage as Record<string, unknown>)) {
            textStr = String((msgObj.extendedTextMessage as Record<string, unknown>).text);
          } else if (msgObj.imageMessage) {
            textStr = '📷 Imagen recibida';
          } else if (msgObj.audioMessage) {
            textStr = '🎤 Nota de voz / Audio';
          } else if (msgObj.videoMessage) {
            textStr = '🎥 Video recibido';
          } else if (msgObj.documentMessage) {
            textStr = '📄 Documento adjunto';
          } else if (msgObj.stickerMessage) {
            textStr = '🏷️ Sticker';
          } else if (msgObj.contactMessage || msgObj.contactsArrayMessage) {
            textStr = '👤 Contacto compartido';
          } else if (msgObj.locationMessage) {
            textStr = '📍 Ubicación compartida';
          } else {
            const firstVal = Object.values(msgObj)[0];
            if (typeof firstVal === 'string' && !firstVal.startsWith('[')) {
              textStr = firstVal;
            } else if (firstVal && typeof firstVal === 'object' && 'caption' in (firstVal as Record<string, unknown>)) {
              textStr = String((firstVal as Record<string, unknown>).caption) || 'Mensaje multimedia';
            } else {
              textStr = 'Mensaje recibido';
            }
          }
        }
        
        // Truncate long messages
        if (textStr.length > 120) textStr = textStr.substring(0, 120) + '...';

        // Format time from updatedAt
        let timeStr = 'Reciente';
        if (c.updatedAt) {
          try {
            const d = new Date(c.updatedAt);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) {
              timeStr = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            } else {
              timeStr = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
            }
          } catch { timeStr = 'Reciente'; }
        }

        // Check if not already mapped from DB
        if (!mappedConversaciones.some(m => m.ciudadanoTelefono.includes(phone))) {
          mappedConversaciones.push({
            id: `chat-${phone}`,
            remoteJid: jid,
            ciudadanoNombre: name,
            ciudadanoTelefono: displayPhone,
            ciudadanoAvatar: avatarUrl,
            municipio: 'Centro',
            colonia: 'WhatsApp Directo',
            ultimoMensaje: textStr,
            ultimaHora: timeStr,
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
                hora: timeStr,
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
