/**
 * Google Calendar API (v3) & OAuth 2.0 Integration Client
 */

import { MEXICO_TIMEZONE } from './date-utils';

export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Retorna las credenciales de cliente OAuth configuradas en variables de entorno
 */
export function getGoogleOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  return { clientId, clientSecret };
}

/**
 * Genera la URL de autorización para el consentimiento de Google
 */
export function getGoogleOAuthUrl(redirectUri: string, state: string = 'agenda_sync'): string {
  const { clientId } = getGoogleOAuthCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_AUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Canjea el código de autorización por tokens de acceso y refresco
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  email?: string;
  name?: string;
}> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en canje de código Google OAuth: ${errText}`);
  }

  const tokenData = await res.json();

  // Obtener perfil del usuario (email)
  let email = '';
  let name = '';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      email = userData.email || '';
      name = userData.name || '';
    }
  } catch (e) {
    console.warn('No se pudo obtener el perfil de Google:', e);
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in || 3600,
    email,
    name,
  };
}

/**
 * Refresca un token de acceso expirado utilizando el refresh_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al refrescar token de Google: ${errText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Convierte fecha y hora (en America/Mexico_City) a formato ISO para Google Calendar
 */
function toGoogleDateTime(fecha: string, hora: string): string {
  const cleanHora = hora.includes(':') ? hora : `${hora}:00`;
  const [h, m] = cleanHora.split(':');
  const hh = String(h).padStart(2, '0');
  const mm = String(m || '00').padStart(2, '0');
  return `${fecha}T${hh}:${mm}:00`;
}

/**
 * Inserta un evento en el Google Calendar del usuario
 */
export async function insertGoogleCalendarEvent(
  accessToken: string,
  calendarId: string = 'primary',
  event: {
    titulo: string;
    tipo?: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    lugarNombre?: string;
    lugarUrl?: string;
    notas?: string;
  }
): Promise<string | null> {
  try {
    const startDateTime = toGoogleDateTime(event.fecha, event.horaInicio);
    const endDateTime = toGoogleDateTime(event.fecha, event.horaFin || event.horaInicio);

    const descriptionParts = [];
    if (event.tipo) descriptionParts.push(`📌 Tipo de evento: ${event.tipo}`);
    if (event.lugarUrl) descriptionParts.push(`📍 Mapa / Ubicación: ${event.lugarUrl}`);
    if (event.notas) descriptionParts.push(`📝 Notas:\n${event.notas}`);
    descriptionParts.push(`\n⚡ Sincronizado desde LegisLab`);

    const gcalPayload = {
      summary: event.titulo,
      description: descriptionParts.join('\n\n'),
      location: event.lugarNombre || '',
      start: {
        dateTime: `${startDateTime}-06:00`,
        timeZone: MEXICO_TIMEZONE,
      },
      end: {
        dateTime: `${endDateTime}-06:00`,
        timeZone: MEXICO_TIMEZONE,
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gcalPayload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn('Google Calendar API insert error:', err);
      return null;
    }

    const created = await res.json();
    return created.id || null;
  } catch (error) {
    console.error('Error in insertGoogleCalendarEvent:', error);
    return null;
  }
}

/**
 * Actualiza un evento existente en Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string = 'primary',
  googleEventId: string,
  event: {
    titulo: string;
    tipo?: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    lugarNombre?: string;
    lugarUrl?: string;
    notas?: string;
  }
): Promise<boolean> {
  try {
    if (!googleEventId) return false;

    const startDateTime = toGoogleDateTime(event.fecha, event.horaInicio);
    const endDateTime = toGoogleDateTime(event.fecha, event.horaFin || event.horaInicio);

    const descriptionParts = [];
    if (event.tipo) descriptionParts.push(`📌 Tipo de evento: ${event.tipo}`);
    if (event.lugarUrl) descriptionParts.push(`📍 Mapa / Ubicación: ${event.lugarUrl}`);
    if (event.notas) descriptionParts.push(`📝 Notas:\n${event.notas}`);
    descriptionParts.push(`\n⚡ Sincronizado desde LegisLab`);

    const gcalPayload = {
      summary: event.titulo,
      description: descriptionParts.join('\n\n'),
      location: event.lugarNombre || '',
      start: {
        dateTime: `${startDateTime}-06:00`,
        timeZone: MEXICO_TIMEZONE,
      },
      end: {
        dateTime: `${endDateTime}-06:00`,
        timeZone: MEXICO_TIMEZONE,
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gcalPayload),
      }
    );

    return res.ok;
  } catch (error) {
    console.error('Error in updateGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string = 'primary',
  googleEventId: string
): Promise<boolean> {
  try {
    if (!googleEventId) return false;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.status === 204 || res.status === 404 || res.ok;
  } catch (error) {
    console.error('Error in deleteGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Obtiene la lista de eventos de Google Calendar en un rango de fechas
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: string,
  timeMax?: string
): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      timeZone: MEXICO_TIMEZONE,
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('Error fetching Google Calendar events:', await res.text());
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error in fetchGoogleCalendarEvents:', error);
    return [];
  }
}
