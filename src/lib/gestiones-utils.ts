export type EstadoGestion = 'Recibida' | 'En Revisión' | 'En Trámite con Dependencia' | 'Resuelta';

export const ESTADOS_KANBAN: EstadoGestion[] = ['Recibida', 'En Revisión', 'En Trámite con Dependencia', 'Resuelta'];

export const TIPOS_GESTION_BASE = [
  'Salud',
  'Educación',
  'Obras Públicas',
  'Apoyo Económico',
  'Vivienda',
  'Asesoría Legal',
  'Deporte',
  'Medio Ambiente'
];

/**
 * Normaliza cualquier estatus guardado en base de datos (e.g. 'En Trámite', 'en tramite',
 * 'Recibida', 'Pendiente', etc.) a las 4 columnas del tablero Kanban oficial.
 */
export function normalizeEstadoGestion(raw?: string | null): EstadoGestion {
  if (!raw) return 'Recibida';
  const clean = raw.trim().toLowerCase();
  if (clean.includes('resol') || clean.includes('conclu') || clean.includes('termin') || clean.includes('resuelt')) {
    return 'Resuelta';
  }
  if (clean.includes('depend') || clean.includes('trámite') || clean.includes('tramite') || clean.includes('canaliz')) {
    return 'En Trámite con Dependencia';
  }
  if (clean.includes('revis') || clean.includes('proceso') || clean.includes('evalua')) {
    return 'En Revisión';
  }
  return 'Recibida';
}

export interface EventoHistorial {
  id: string;
  fechaDisplay: string; // ej: "Mar, 13 de abril de 2026"
  horaDisplay?: string;  // ej: "14:05"
  usuario: string;      // ej: "Dip. Manuel Gurría"
  accion: string;       // ej: "agregó esta gestión."
  tipo: 'creacion' | 'estatus' | 'observacion' | 'asignacion' | 'edicion' | 'documento';
  createdAt: string;    // ISO string
}

/**
 * Formatea una fecha al estilo requerido: "Mar, 13 de abril de 2026"
 */
export function formatFechaHistorial(dateInput?: Date | string | number | null): string {
  if (!dateInput) return 'Fecha reciente';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Fecha reciente';

  const formatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(d);
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';

  const capWeekday = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '') : '';
  return `${capWeekday}, ${day} de ${month} de ${year}`;
}

/**
 * Formatea la hora en zona horaria de México: "14:05"
 */
export function formatHoraHistorial(dateInput?: Date | string | number | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Agrega un evento a la bitácora de historial dentro de notasInternas (JSON)
 */
export function appendHistorialToMeta(
  notasInternasStr: string | null | undefined,
  evento: {
    usuario: string;
    accion: string;
    tipo: 'creacion' | 'estatus' | 'observacion' | 'asignacion' | 'edicion' | 'documento';
    fecha?: Date;
  }
): { meta: any; metaStr: string } {
  let meta: any = {};
  if (notasInternasStr) {
    try { meta = JSON.parse(notasInternasStr); } catch {}
  }

  const now = evento.fecha || new Date();
  const nuevoEvento: EventoHistorial = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fechaDisplay: formatFechaHistorial(now),
    horaDisplay: formatHoraHistorial(now),
    usuario: evento.usuario,
    accion: evento.accion,
    tipo: evento.tipo,
    createdAt: now.toISOString(),
  };

  const currentHistorial = Array.isArray(meta.historial) ? meta.historial : [];
  meta.historial = [nuevoEvento, ...currentHistorial].slice(0, 50);

  return { meta, metaStr: JSON.stringify(meta) };
}

