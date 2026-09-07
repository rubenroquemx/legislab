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
  id?: string;
  jid?: string;
  JID?: string;
  subject?: string;
  name?: string;
  subjectOwner?: string;
  subjectTime?: number;
  size?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  participants?: Array<{
    id?: string;
    jid?: string;
    admin?: string | null;
  }>;
}

export interface WhatsAppChat {
  id?: string;
  remoteJid?: string;
  jid?: string;
  name?: string;
  pushName?: string;
  profilePicUrl?: string;
  unreadCount?: number;
  updatedAt?: string;
  lastMessage?: {
    key?: { remoteJid?: string; fromMe?: boolean; participant?: string };
    pushName?: string;
    message?: Record<string, unknown>;
    messageType?: string;
    messageTimestamp?: number | string;
  };
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

export async function fetchInstances() {
  return evolutionFetch<Array<{ instance: { instanceName: string; status: string } }>>('/instance/fetchInstances');
}

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

export async function connectInstance(instanceName: string) {
  return evolutionFetch<QrResponse>(`/instance/connect/${encodeURIComponent(instanceName)}`);
}

export async function getConnectionState(instanceName: string) {
  return evolutionFetch<InstanceConnectionState>(
    `/instance/connectionState/${encodeURIComponent(instanceName)}`
  );
}

export async function logoutInstance(instanceName: string) {
  return evolutionFetch<{ status: string }>(
    `/instance/logout/${encodeURIComponent(instanceName)}`,
    { method: 'DELETE' }
  );
}

export async function deleteInstance(instanceName: string) {
  return evolutionFetch<{ status: string }>(
    `/instance/delete/${encodeURIComponent(instanceName)}`,
    { method: 'DELETE' }
  );
}

export interface WhatsAppContact {
  id?: string;
  remoteJid?: string;
  pushName?: string;
  profilePicUrl?: string;
  isGroup?: boolean;
  isSaved?: boolean;
  type?: string;
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `521${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('52')) {
    return `521${digits.substring(2)}`;
  }
  return digits;
}

export async function sendTextMessage(
  instanceName: string,
  phoneNumber: string,
  text: string
) {
  const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
  const payload = {
    number: formattedNumber,
    text,
  };

  return evolutionFetch<SendMessageResult>(
    `/message/sendText/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function fetchAllContacts(instanceName: string) {
  const res = await evolutionFetch<WhatsAppContact[] | { contacts?: WhatsAppContact[] }>(
    `/chat/findContacts/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
  if (res.success && res.data) {
    if (Array.isArray(res.data)) return { success: true, data: res.data };
    if (Array.isArray((res.data as { contacts?: WhatsAppContact[] }).contacts)) {
      return { success: true, data: (res.data as { contacts: WhatsAppContact[] }).contacts };
    }
  }
  return res as { success: boolean; data?: WhatsAppContact[]; error?: string };
}

export async function fetchAllChats(instanceName: string) {
  const res = await evolutionFetch<WhatsAppChat[] | { chats?: WhatsAppChat[] }>(
    `/chat/findChats/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
  if (res.success && res.data) {
    if (Array.isArray(res.data)) return { success: true, data: res.data };
    if (Array.isArray((res.data as { chats?: WhatsAppChat[] }).chats)) {
      return { success: true, data: (res.data as { chats: WhatsAppChat[] }).chats };
    }
  }
  return res as { success: boolean; data?: WhatsAppChat[]; error?: string };
}

// ---------------------------------------------------------------------------
// GROUPS MANAGEMENT
// ---------------------------------------------------------------------------

export async function fetchAllGroups(instanceName: string, getParticipants = true) {
  const res = await evolutionFetch<WhatsAppGroup[] | { groups?: WhatsAppGroup[] }>(
    `/group/fetchAllGroups/${encodeURIComponent(instanceName)}?getParticipants=${getParticipants}`
  );
  if (res.success && res.data) {
    if (Array.isArray(res.data)) return { success: true, data: res.data };
    if (Array.isArray((res.data as { groups?: WhatsAppGroup[] }).groups)) {
      return { success: true, data: (res.data as { groups: WhatsAppGroup[] }).groups };
    }
  }
  return res as { success: boolean; data?: WhatsAppGroup[]; error?: string };
}

// ---------------------------------------------------------------------------
// WEBHOOK CONFIGURATION
// ---------------------------------------------------------------------------

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
