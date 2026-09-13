'use client';

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
