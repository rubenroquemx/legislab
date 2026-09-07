/**
 * Evolution API WhatsApp Gateway Client
 * Compatible with Evolution API v1 and v2
 */

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
}

export interface InstanceConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'connecting' | 'close' | 'refused';
  };
}

export interface QrResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface SendMessageResult {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: Record<string, unknown>;
  messageTimestamp: string | number;
  status: string;
}

export interface WhatsAppGroup {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  size?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  participants?: Array<{
    id: string;
    admin?: string | null;
  }>;
}

function getEvolutionConfig(): EvolutionConfig {
  const url = process.env.EVOLUTION_API_URL || process.env.SERVER_URL || 'http://localhost:8080';
  const key = process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY || '';
  return {
    apiUrl: url.replace(/\/+$/, ''),
    apiKey: key,
  };
}

/**
 * Helper to execute authorized requests to Evolution API
 */
async function evolutionFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const { apiUrl, apiKey } = getEvolutionConfig();

  if (!apiUrl) {
    return { success: false, error: 'EVOLUTION_API_URL no está configurada.' };
  }

  const url = `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (apiKey) {
    headers['apikey'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const text = await res.text();
    let json: T | undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }

    if (!res.ok) {
      const errorMsg =
        (json as { message?: string | string[] })?.message ||
        (json as { error?: string })?.error ||
        `Error HTTP ${res.status}: ${res.statusText}`;
      return {
        success: false,
        error: Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg),
        status: res.status,
      };
    }

    return { success: true, data: json, status: res.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Error de conexión con Evolution API (${apiUrl}): ${msg}` };
  }
}

// ---------------------------------------------------------------------------
// INSTANCE MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Lists all instances on the Evolution API server
 */
export async function fetchInstances() {
  return evolutionFetch<Array<{ instance: { instanceName: string; status: string } }>>('/instance/fetchInstances');
}

/**
 * Creates a new instance for a Titular / Despacho
 */
export async function createInstance(
  instanceName: string,
  webhookUrl?: string
) {
  const payload: Record<string, unknown> = {
    instanceName,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  };

  if (webhookUrl) {
    payload.webhook = {
      url: webhookUrl,
      byEvents: false,
      base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'GROUPS_UPSERT',
        'GROUP_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
      ],
    };
  }

  return evolutionFetch<{ instance: { instanceName: string; instanceId: string }; hash?: { apikey: string } }>(
    '/instance/create',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Connects an instance and retrieves the QR Code base64 string
 */
export async function connectInstance(instanceName: string) {
  return evolutionFetch<QrResponse>(`/instance/connect/${encodeURIComponent(instanceName)}`);
}

/**
 * Gets the current connection status of an instance (open, connecting, close)
 */
export async function getConnectionState(instanceName: string) {
  return evolutionFetch<InstanceConnectionState>(
    `/instance/connectionState/${encodeURIComponent(instanceName)}`
  );
}

/**
 * Logs out / disconnects an active instance
 */
export async function logoutInstance(instanceName: string) {
  return evolutionFetch<{ status: string }>(
    `/instance/logout/${encodeURIComponent(instanceName)}`,
    { method: 'DELETE' }
  );
}

/**
 * Deletes an instance completely
 */
export async function deleteInstance(instanceName: string) {
  return evolutionFetch<{ status: string }>(
    `/instance/delete/${encodeURIComponent(instanceName)}`,
    { method: 'DELETE' }
  );
}

// ---------------------------------------------------------------------------
// MESSAGING & CHAT
// ---------------------------------------------------------------------------

/**
 * Clean phone number to E.164 without '+' or spaces for WhatsApp
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `52${digits}`;
  }
  return digits;
}

/**
 * Sends a plain text WhatsApp message to a citizen or contact
 */
export async function sendTextMessage(
  instanceName: string,
  phoneNumber: string,
  text: string
) {
  const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
  const payload = {
    number: formattedNumber,
    text,
    options: {
      delay: 1200,
      presence: 'composing',
      linkPreview: true,
    },
  };

  return evolutionFetch<SendMessageResult>(
    `/message/sendText/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// ---------------------------------------------------------------------------
// GROUPS MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Fetches all WhatsApp groups that the connected instance is part of
 */
export async function fetchAllGroups(instanceName: string, getParticipants = true) {
  return evolutionFetch<WhatsAppGroup[]>(
    `/group/fetchAllGroups/${encodeURIComponent(instanceName)}?getParticipants=${getParticipants}`
  );
}

// ---------------------------------------------------------------------------
// WEBHOOK CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * Updates the webhook destination URL for an instance
 */
export async function setInstanceWebhook(
  instanceName: string,
  webhookUrl: string
) {
  const payload = {
    webhook: {
      enabled: true,
      url: webhookUrl,
      byEvents: false,
      base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'GROUPS_UPSERT',
        'GROUP_UPDATE',
        'GROUP_PARTICIPANTS_UPDATE',
      ],
    },
  };

  return evolutionFetch<{ status: string }>(
    `/webhook/set/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}
