'use server';

import {
  createInstance,
  connectInstance,
  getConnectionState,
  logoutInstance,
  sendTextMessage,
  fetchAllGroups,
  formatPhoneForWhatsApp,
} from '@/lib/evolution-api';
import { db } from '@/db';
import { gruposContactos, grupoMiembros, atencionMensajes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getFirstOfficeId } from './gestiones';

const DEFAULT_INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || 'legislab-despacho';

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
    // 1. Try to connect to existing instance
    let connectRes = await connectInstance(instanceName);

    // 2. If instance does not exist (404/not found), create it first
    if (!connectRes.success && (connectRes.status === 404 || connectRes.error?.toLowerCase().includes('not found') || connectRes.error?.toLowerCase().includes('não encontrada'))) {
      const createRes = await createInstance(instanceName);
      if (!createRes.success) {
        return {
          success: false,
          error: createRes.error || 'Error al crear la instancia en Evolution API',
        };
      }
      // Retry connect after creating
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
 * Sincroniza en vivo los grupos reales de WhatsApp desde Evolution API hacia la BD
 */
export async function syncWhatsAppGroups(instanceName = DEFAULT_INSTANCE_NAME) {
  try {
    const res = await fetchAllGroups(instanceName, true);
    if (!res.success || !res.data) {
      return {
        success: false,
        error: res.error || 'No se pudieron consultar los grupos en Evolution API. Verifica que WhatsApp esté conectado.',
      };
    }

    const groups = res.data;
    const officeId = await getFirstOfficeId();
    let importedGroupsCount = 0;
    let importedMembersCount = 0;

    for (const g of groups) {
      if (!g.id || !g.subject) continue;

      // Check if group already exists in database
      const existing = await db
        .select()
        .from(gruposContactos)
        .where(eq(gruposContactos.nombre, g.subject))
        .limit(1);

      let grupoId: string;

      if (existing.length > 0) {
        grupoId = existing[0].id;
      } else {
        const [newGroup] = await db
          .insert(gruposContactos)
          .values({
            officeId,
            nombre: g.subject,
            categoria: 'Comunitario',
            color: 'emerald',
            whatsappLink: `https://chat.whatsapp.com/${g.id.split('@')[0]}`,
          })
          .returning();
        grupoId = newGroup.id;
        importedGroupsCount++;
      }

      // Sync members if provided
      if (g.participants && g.participants.length > 0) {
        for (const p of g.participants) {
          const rawPhone = p.id.split('@')[0];
          const cleanPhone = formatPhoneForWhatsApp(rawPhone);

          // Avoid duplicate members in same group
          const memberExists = await db
            .select()
            .from(grupoMiembros)
            .where(eq(grupoMiembros.telefono, cleanPhone))
            .limit(1);

          if (memberExists.length === 0) {
            await db.insert(grupoMiembros).values({
              grupoId,
              nombre: `Contacto +${cleanPhone}`,
              cargo: p.admin ? 'Administrador del Grupo' : 'Integrante',
              telefono: `+${cleanPhone}`,
              municipio: 'Centro',
            });
            importedMembersCount++;
          }
        }
      }
    }

    return {
      success: true,
      totalGrupos: groups.length,
      importedGroupsCount,
      importedMembersCount,
      message: `¡Sincronización exitosa! ${groups.length} grupos detectados en WhatsApp.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Error durante la sincronización: ${msg}`,
    };
  }
}
