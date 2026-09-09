/**
 * Utilidades de fecha y hora configuradas específicamente para la zona horaria de México (America/Mexico_City).
 */

export const MEXICO_TIMEZONE = 'America/Mexico_City';

/**
 * Retorna la fecha actual en formato 'YYYY-MM-DD' en la zona horaria America/Mexico_City.
 */
export function getTodayMexicoCity(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Retorna la hora actual en formato 'HH:MM' (24h) en la zona horaria America/Mexico_City.
 */
export function getCurrentTimeMexicoCity(): string {
  const formatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Retorna la hora actual con segundos en formato legible en America/Mexico_City.
 */
export function getCurrentTimeFullMexicoCity(): string {
  return new Date().toLocaleTimeString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formatea una fecha dada a 'YYYY-MM-DD' en America/Mexico_City.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Parsea un string 'YYYY-MM-DD' a un objeto Date seguro contra desfasajes de zona horaria (al mediodía UTC).
 */
export function parseDateSafe(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

/**
 * Formatea un string 'YYYY-MM-DD' a un formato legible en español (ej: "8 de septiembre de 2026").
 */
export function formatDateDisplay(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDateSafe(dateStr);
  return date.toLocaleDateString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    ...options,
  });
}

/**
 * Formatea un timestamp Date / ISO string a fecha y hora en America/Mexico_City.
 */
export function formatDateTimeMexicoCity(
  dateInput: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return date.toLocaleString('es-MX', {
    timeZone: MEXICO_TIMEZONE,
    ...options,
  });
}
