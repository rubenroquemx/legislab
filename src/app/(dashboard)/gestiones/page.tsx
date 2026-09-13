'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getGestiones, 
  updateGestionStatus,
  toggleArchiveGestionAction
} from '@/app/actions/gestiones';
import { getGoogleDriveStatusAction } from '@/app/actions/drive';
import { MEXICO_TIMEZONE, getTodayMexicoCity } from '@/lib/date-utils';
import { 
  Plus, 
  Search, 
  LayoutList, 
  Kanban, 
  FileText, 
  MessageCircle,
  Archive,
  ArchiveRestore,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Filter,
  AlertTriangle,
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import { 
  EstadoGestion, 
  ESTADOS_KANBAN, 
  TIPOS_GESTION_BASE, 
  normalizeEstadoGestion 
} from '@/lib/gestiones-utils';
import { AirbnbDateRangeFilter } from '@/components/ui/airbnb-date-range-filter';

export interface NotaObservacion {
  id: string;
  fecha: string;
  hora: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}

export interface DocumentoExpediente {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  tamano: string;
  urlDrive: string;
}

export interface OficioGenerado {
  id: string;
  folioOficio: string;
  tipoOficio: string;
  destinatario: string;
  cargo: string;
  dependencia: string;
  fecha: string;
  contenido: string;
}

export interface GestionCiudadana {
  id: string;
  folio: string;
  nombre: string;
  avatarUrl?: string;
  telefono: string;
  municipio: string;
  curp: string;
  direccion: string;
  colonia: string;
  seccionElectoral: string;
  tipo: string;
  descripcion: string;
  estatus: EstadoGestion;
  prioridad: 'Alta' | 'Media' | 'Baja';
  dependenciaDestino: string;
  fecha: string;
  fechaRecepcionISO: string;
  fechaResolucionISO: string | null;
  fechaResolucionDisplay: string | null;
  archivada: boolean;
  driveFolderUrl: string;
  documentos: DocumentoExpediente[];
  oficios: OficioGenerado[];
  notas: NotaObservacion[];
}

export default function GestionesPage() {
  const router = useRouter();
  const [gestiones, setGestiones] = useState<GestionCiudadana[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiposGestion, setTiposGestion] = useState<string[]>(TIPOS_GESTION_BASE);

  // View state: 'kanban' | 'lista'
  const [vistaModo, setVistaModo] = useState<'kanban' | 'lista'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
  const [filtroArchivo, setFiltroArchivo] = useState<'todos' | 'activas' | 'archivadas'>('todos');
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);

  // Filtros de Rango de Fechas estilo Airbnb
  const [filtroRecepcionDesde, setFiltroRecepcionDesde] = useState<string>('');
  const [filtroRecepcionHasta, setFiltroRecepcionHasta] = useState<string>('');
  const [filtroFinalizacionDesde, setFiltroFinalizacionDesde] = useState<string>('');
  const [filtroFinalizacionHasta, setFiltroFinalizacionHasta] = useState<string>('');

  // Kanban: Toggle para ver archivadas en la columna Resuelta
  const [mostrarArchivadasKanban, setMostrarArchivadasKanban] = useState(false);

  // Drag in Kanban
  const [draggedGestionId, setDraggedGestionId] = useState<string | null>(null);

  const loadGestiones = async () => {
    try {
      setLoading(true);
      const res = await getGestiones();
      if (res.success && res.data && res.data.length > 0) {
        const mapped: GestionCiudadana[] = res.data.map((d: any) => {
          let docs: DocumentoExpediente[] = [];
          if (d.documentos) {
            try {
              docs = typeof d.documentos === 'string' ? JSON.parse(d.documentos) : d.documentos;
              if (!Array.isArray(docs)) docs = [];
            } catch { docs = []; }
          }
          let ofs: OficioGenerado[] = [];
          if (d.oficios) {
            try {
              ofs = typeof d.oficios === 'string' ? JSON.parse(d.oficios) : d.oficios;
              if (!Array.isArray(ofs)) ofs = [];
            } catch { ofs = []; }
          }
          let nts: NotaObservacion[] = [];
          if (d.notas) {
            try {
              nts = typeof d.notas === 'string' ? JSON.parse(d.notas) : d.notas;
              if (!Array.isArray(nts)) nts = [];
            } catch { nts = []; }
          }

          // Metadata interna (archivado y fecha de resolución)
          let meta: any = {};
          if (d.notasInternas) {
            try {
              meta = typeof d.notasInternas === 'string' ? JSON.parse(d.notasInternas) : d.notasInternas;
            } catch {
              meta = { archivada: d.notasInternas === 'ARCHIVADA' };
            }
          }

          const estatusNormalizado = normalizeEstadoGestion(d.estatus);
          const archivada = Boolean(meta.archivada);

          // Fecha de recepción ISO (YYYY-MM-DD)
          let fechaRecepcionISO = getTodayMexicoCity();
          if (d.createdAt) {
            try {
              fechaRecepcionISO = new Date(d.createdAt).toISOString().split('T')[0];
            } catch {}
          }

          // Fecha de resolución ISO (YYYY-MM-DD)
          let fechaResolucionISO: string | null = null;
          let fechaResolucionDisplay: string | null = null;
          if (meta.fechaResolucion) {
            try {
              fechaResolucionISO = new Date(meta.fechaResolucion).toISOString().split('T')[0];
            } catch {}
          } else if (estatusNormalizado === 'Resuelta' && d.updatedAt) {
            try {
              fechaResolucionISO = new Date(d.updatedAt).toISOString().split('T')[0];
            } catch {}
          }

          if (fechaResolucionISO) {
            try {
              const [y, m, day] = fechaResolucionISO.split('-');
              const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(day), 12, 0, 0);
              fechaResolucionDisplay = dObj.toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric' });
            } catch {
              fechaResolucionDisplay = fechaResolucionISO;
            }
          }

          return {
            id: d.id,
            folio: d.folio || 'GES-2026',
            nombre: d.solicitante || 'Ciudadano',
            avatarUrl: d.avatarUrl || undefined,
            telefono: d.telefono || 'Sin teléfono',
            municipio: d.municipio || 'Centro',
            curp: d.curp || '',
            direccion: d.direccion || '',
            colonia: d.colonia || '',
            seccionElectoral: d.seccionElectoral || '',
            tipo: d.categoria || 'General',
            descripcion: d.asunto || '',
            estatus: estatusNormalizado,
            prioridad: (d.prioridad as any) || 'Media',
            dependenciaDestino: d.dependenciaCanalizada || 'General',
            fecha: d.createdAt 
              ? new Date(d.createdAt).toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric' }) 
              : 'Hoy',
            fechaRecepcionISO,
            fechaResolucionISO,
            fechaResolucionDisplay,
            archivada,
            driveFolderUrl: d.driveFolderUrl || '',
            documentos: docs,
            oficios: ofs,
            notas: nts,
          };
        });

        setGestiones(mapped);

        // Dinámicamente añadir categorías existentes de las gestiones
        const existingTipos = mapped.map(m => m.tipo).filter(Boolean);
        const uniqueTipos = Array.from(new Set([...TIPOS_GESTION_BASE, ...existingTipos]));
        setTiposGestion(uniqueTipos);
      } else {
        setGestiones([]);
      }
    } catch (err) {
      console.warn('Error loading gestiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGestiones();
    getGoogleDriveStatusAction()
      .then(res => setDriveConnected(Boolean(res?.connected)))
      .catch(() => setDriveConnected(false));
  }, []);

  // Filter logic con Rango de Fechas estilo Airbnb
  const filteredGestiones = gestiones.filter((g) => {
    // 1. Buscador textual
    const s = searchTerm.trim().toLowerCase();
    const matchesSearch = !s ||
      (g.nombre && g.nombre.toLowerCase().includes(s)) ||
      (g.folio && g.folio.toLowerCase().includes(s)) ||
      (g.curp && g.curp.toLowerCase().includes(s)) ||
      (g.seccionElectoral && g.seccionElectoral.toLowerCase().includes(s)) ||
      (g.colonia && g.colonia.toLowerCase().includes(s)) ||
      (g.descripcion && g.descripcion.toLowerCase().includes(s)) ||
      (g.tipo && g.tipo.toLowerCase().includes(s)) ||
      (g.notas && g.notas.some(n => n.texto && n.texto.toLowerCase().includes(s)));
    
    if (!matchesSearch) return false;

    // 2. Filtro de Estatus
    if (filtroEstatus !== 'Todos' && g.estatus !== filtroEstatus) {
      return false;
    }

    // 3. Filtro de Categoría / Tipo
    if (filtroTipo !== 'Todos' && g.tipo !== filtroTipo) {
      return false;
    }

    // 4. Filtro de Archivo (para vista de tabla)
    if (vistaModo === 'lista') {
      if (filtroArchivo === 'activas' && g.archivada) return false;
      if (filtroArchivo === 'archivadas' && !g.archivada) return false;
    }

    // 5. Filtro de Rango: Fecha de Recepción (Airbnb Style)
    if (filtroRecepcionDesde && g.fechaRecepcionISO < filtroRecepcionDesde) {
      return false;
    }
    if (filtroRecepcionHasta && g.fechaRecepcionISO > filtroRecepcionHasta) {
      return false;
    }

    // 6. Filtro de Rango: Fecha de Finalización (Airbnb Style)
    if (filtroFinalizacionDesde) {
      if (!g.fechaResolucionISO || g.fechaResolucionISO < filtroFinalizacionDesde) {
        return false;
      }
    }
    if (filtroFinalizacionHasta) {
      if (!g.fechaResolucionISO || g.fechaResolucionISO > filtroFinalizacionHasta) {
        return false;
      }
    }

    return true;
  });

  const handleCambiarEstado = async (gestionId: string, nuevoEstado: EstadoGestion) => {
    const todayISO = getTodayMexicoCity();
    const todayDisplay = new Date().toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric' });

    setGestiones(prev => prev.map(g => {
      if (g.id === gestionId) {
        return {
          ...g,
          estatus: nuevoEstado,
          fechaResolucionISO: nuevoEstado === 'Resuelta' ? (g.fechaResolucionISO || todayISO) : null,
          fechaResolucionDisplay: nuevoEstado === 'Resuelta' ? (g.fechaResolucionDisplay || todayDisplay) : null,
        };
      }
      return g;
    }));

    try {
      await updateGestionStatus(gestionId, nuevoEstado);
    } catch (err) {
      console.error('Error updating gestion status in DB:', err);
    }
  };

  const handleArchivarGestion = async (gestionId: string, archivar: boolean) => {
    // Actualizar inmediatamente en el estado para feedback visual instantáneo
    setGestiones(prev => prev.map(g => g.id === gestionId ? { ...g, archivada: archivar } : g));

    try {
      await toggleArchiveGestionAction(gestionId, archivar);
    } catch (err) {
      console.error('Error toggling archive in DB:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedGestionId(id);
  };

  const handleDropKanban = (e: React.DragEvent, estadoDestino: EstadoGestion) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedGestionId;
    if (!id) return;
    handleCambiarEstado(id, estadoDestino);
    setDraggedGestionId(null);
  };

  const getEstatusBadge = (est: EstadoGestion) => {
    switch (est) {
      case 'Recibida':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'En Revisión':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Trámite con Dependencia':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Resuelta':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPrioridadBadge = (p: string) => {
    switch (p) {
      case 'Alta':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Media':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderAvatar = (ges: { nombre: string; avatarUrl?: string }, size = 'md') => {
    const sizeClasses = 
      size === 'sm' ? 'h-7 w-7 text-xs' :
      size === 'lg' ? 'h-16 w-16 text-lg' :
      size === 'xl' ? 'h-20 w-20 text-xl' : 'h-9 w-9 text-xs';

    if (ges.avatarUrl) {
      return (
        <div className={`${sizeClasses} rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs relative bg-gray-100 dark:bg-gray-800`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ges.avatarUrl}
            alt={ges.nombre}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    const initials = ges.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 border-2 border-white shadow-xs`}>
        {initials || 'C'}
      </div>
    );
  };

  const totalArchivadasResueltas = gestiones.filter(g => g.estatus === 'Resuelta' && g.archivada).length;
  const hayFiltrosFechaActivos = Boolean(filtroRecepcionDesde || filtroRecepcionHasta || filtroFinalizacionDesde || filtroFinalizacionHasta);

  return (
    <div className="space-y-6">
      {/* iOS Large Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div className="space-y-0.5">
          <h1 className="text-ios-large-title font-bold text-[#0F172A] tracking-tight">
            Gestiones Ciudadanas
          </h1>
          <p className="text-ios-subhead text-[#94A3B8]">
            Trámite de solicitudes, expedientes digitales y oficios con IA
          </p>
        </div>

        <Link
          href="/gestiones/nueva"
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1550BA] text-white text-ios-body font-semibold px-4 py-2 rounded-[12px] shadow-xs ios-press cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2]" />
          <span>Nueva Gestión</span>
        </Link>
      </div>

      {/* Alerta si Google Drive no está conectado al despacho */}
      {driveConnected === false && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">Google Drive no está conectado al despacho</h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium">
                Para que cada gestión genere automáticamente su carpeta oficial por número de folio (<span className="font-mono font-semibold">GES-2026-XXXX</span>) y los expedientes del ciudadano se guarden en la nube, es necesario conectar la cuenta institucional de Google Drive.
              </p>
            </div>
          </div>
          <Link
            href="/configuracion?tab=conexiones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
          >
            <span>Conectar Google Drive</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Bar: View Switcher (Lista vs Kanban) + Filters & Search */}
      <div className="bg-white dark:bg-[#121824] p-3 sm:p-4 rounded-[14px] border border-[#E5E5EA]/80 dark:border-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switcher Tablero Kanban / Lista */}
            <div className="flex items-center bg-[#F0F2F5] dark:bg-gray-800/80 p-1 rounded-[10px] text-xs font-semibold">
              <button
                onClick={() => setVistaModo('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-all ios-press ${
                  vistaModo === 'kanban'
                    ? 'bg-white dark:bg-gray-900 text-[#0F172A] dark:text-white shadow-xs font-bold'
                    : 'text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                <Kanban className="h-3.5 w-3.5 stroke-[1.75]" />
                <span>Tablero Kanban</span>
              </button>
              <button
                onClick={() => setVistaModo('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-all ios-press ${
                  vistaModo === 'lista'
                    ? 'bg-white dark:bg-gray-900 text-[#0F172A] dark:text-white shadow-xs font-bold'
                    : 'text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5 stroke-[1.75]" />
                <span>Lista / Tabla</span>
              </button>
            </div>

            {/* Selector de Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Todos">Todos los Tipos</option>
              {tiposGestion.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Selector de Estado */}
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Todos">Todos los Estados</option>
              {ESTADOS_KANBAN.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>

            {/* Filtro Archivo (Visible en Modo Lista) */}
            {vistaModo === 'lista' && (
              <select
                value={filtroArchivo}
                onChange={(e) => setFiltroArchivo(e.target.value as any)}
                className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="todos">Activas y Archivadas</option>
                <option value="activas">Solo Activas</option>
                <option value="archivadas">Solo Archivadas</option>
              </select>
            )}
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, folio, CURP, sección..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
            />
          </div>
        </div>

        {/* SECCIÓN AIRBNB STYLE: FILTROS DE RANGO DE FECHAS (Recepción y Finalización) */}
        {vistaModo === 'lista' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Rango de Fechas:</span>
              </span>

              {/* 1. Filtro Rango Fecha Recepción estilo Airbnb */}
              <AirbnbDateRangeFilter
                label="Recepción"
                icon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
                startDate={filtroRecepcionDesde}
                endDate={filtroRecepcionHasta}
                onChange={(desde, hasta) => {
                  setFiltroRecepcionDesde(desde);
                  setFiltroRecepcionHasta(hasta);
                }}
                accentColor="blue"
              />

              {/* 2. Filtro Rango Fecha Finalización estilo Airbnb */}
              <AirbnbDateRangeFilter
                label="Finalización"
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                startDate={filtroFinalizacionDesde}
                endDate={filtroFinalizacionHasta}
                onChange={(desde, hasta) => {
                  setFiltroFinalizacionDesde(desde);
                  setFiltroFinalizacionHasta(hasta);
                }}
                accentColor="emerald"
              />

              {hayFiltrosFechaActivos && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroRecepcionDesde('');
                    setFiltroRecepcionHasta('');
                    setFiltroFinalizacionDesde('');
                    setFiltroFinalizacionHasta('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Limpiar fechas</span>
                </button>
              )}
            </div>

            <span className="text-xs text-gray-400 dark:text-gray-500">
              Mostrando <strong className="text-gray-800 dark:text-gray-200">{filteredGestiones.length}</strong> de {gestiones.length} gestiones
            </span>
          </div>
        )}
      </div>

      {/* 1. VISTA TABLERO KANBAN */}
      {vistaModo === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-start">
          {ESTADOS_KANBAN.map((estadoColumna) => {
            // Si es la columna Resuelta: por defecto ocultar archivadas salvo que el usuario active 'mostrarArchivadasKanban'
            const itemsEnColumna = filteredGestiones.filter((g) => {
              if (g.estatus !== estadoColumna) return false;
              if (estadoColumna === 'Resuelta') {
                return !g.archivada || mostrarArchivadasKanban;
              }
              return true;
            });

            const archivadasEnEstaColumna = gestiones.filter(g => g.estatus === estadoColumna && g.archivada).length;

            return (
              <div
                key={estadoColumna}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropKanban(e, estadoColumna)}
                className="bg-gray-100 dark:bg-gray-800/70 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 min-h-[580px] flex flex-col space-y-3"
              >
                {/* Cabecera de Columna */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      estadoColumna === 'Recibida' ? 'bg-amber-500' :
                      estadoColumna === 'En Revisión' ? 'bg-blue-500' :
                      estadoColumna === 'En Trámite con Dependencia' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}></span>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                      {estadoColumna}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón para ver u ocultar archivadas en la columna Resuelta */}
                    {estadoColumna === 'Resuelta' && archivadasEnEstaColumna > 0 && (
                      <button
                        type="button"
                        onClick={() => setMostrarArchivadasKanban(!mostrarArchivadasKanban)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          mostrarArchivadasKanban
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-gray-900'
                        }`}
                        title={mostrarArchivadasKanban ? 'Ocultar archivadas' : 'Ver archivadas en Kanban'}
                      >
                        📦 {archivadasEnEstaColumna} {mostrarArchivadasKanban ? 'ocultar' : 'archivadas'}
                      </button>
                    )}

                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                      {itemsEnColumna.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {itemsEnColumna.map((ges) => {
                    const ultimaNota = ges.notas[ges.notas.length - 1];
                    const esFinalizada = ges.estatus === 'Resuelta';

                    return (
                      <div
                        key={ges.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ges.id)}
                        onClick={() => router.push(`/gestiones/${ges.id}`)}
                        className={`p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2.5 group relative ${
                          ges.archivada 
                            ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-300/80 dark:border-slate-800 opacity-80' 
                            : 'bg-white dark:bg-[#121824] border-gray-200/80 dark:border-gray-800/90 shadow-xs hover:shadow-md hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {ges.folio}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {ges.archivada && (
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300 flex items-center gap-0.5">
                                <Archive className="h-2.5 w-2.5" />
                                <span>Archivada</span>
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPrioridadBadge(ges.prioridad)}`}>
                              {ges.prioridad}
                            </span>
                          </div>
                        </div>

                        {/* Citizen Avatar + Name Header */}
                        <div className="flex items-center gap-2.5 pt-0.5">
                          {renderAvatar(ges, 'md')}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                              {ges.nombre}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                              {ges.curp ? `CURP: ${ges.curp.slice(0, 10)}...` : ges.telefono}
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-800/40/70 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                          {ges.descripcion}
                        </p>

                        {/* Última nota */}
                        {ultimaNota && (
                          <div className="p-2 bg-[#d9fdd3]/70 rounded-xl border border-emerald-300/60 text-[10px] space-y-0.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-[#00a884]" />
                                <span>{ultimaNota.autor}:</span>
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">{ultimaNota.hora}</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-100 italic line-clamp-1">&quot;{ultimaNota.texto}&quot;</p>
                          </div>
                        )}

                        <div className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium pt-1 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-semibold text-gray-700 dark:text-gray-200">
                              📍 {ges.colonia || ges.municipio}
                            </span>
                            {ges.seccionElectoral && (
                              <span className="text-blue-600 font-bold">Sec. {ges.seccionElectoral}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                            <span>Rubro: <strong className="text-gray-700 dark:text-gray-200">{ges.tipo}</strong></span>
                            <span className="flex items-center gap-1.5">
                              <span>{ges.documentos.length} docs</span>
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                <MessageCircle className="h-2.5 w-2.5" />
                                {ges.notas.length}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Pie de tarjeta con Botón ARCHIVAR para finalizadas */}
                        <div className="flex items-center justify-between pt-1 text-[11px] gap-2">
                          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:underline truncate">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">Expediente ➔</span>
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* BOTÓN ARCHIVAR / DESARCHIVAR EN FINALIZADAS */}
                            {esFinalizada && (
                              ges.archivada ? (
                                <button
                                  type="button"
                                  onClick={() => handleArchivarGestion(ges.id, false)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-all active:scale-95"
                                  title="Restaurar al tablero Kanban"
                                >
                                  <ArchiveRestore className="h-3 w-3" />
                                  <span>Desarchivar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleArchivarGestion(ges.id, true)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs"
                                  title="Archivar para no acumular en el tablero Kanban"
                                >
                                  <Archive className="h-3 w-3 text-slate-600" />
                                  <span>Archivar</span>
                                </button>
                              )
                            )}

                            <span className="text-gray-400 dark:text-gray-500 text-[10px]">{ges.fecha}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {itemsEnColumna.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200/80 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic text-center p-3">
                      {estadoColumna === 'Resuelta' && archivadasEnEstaColumna > 0 && !mostrarArchivadasKanban
                        ? `${archivadasEnEstaColumna} gestión(es) finalizada(s) archivada(s). Activa "ver archivadas" para consultarlas aquí.`
                        : 'Arrastra una gestión aquí'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VISTA TABLA / LISTA (Muestra todas, incluidas archivadas) */}
      {vistaModo === 'lista' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Folio</th>
                  <th className="py-3.5 px-4">Ciudadano (Contacto)</th>
                  <th className="py-3.5 px-4">Ubicación y Sección</th>
                  <th className="py-3.5 px-4">Tipo / Descripción</th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      <span>F. Recepción</span>
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>F. Finalización</span>
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Estatus & Archivo</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200">
                {filteredGestiones.map((ges) => {
                  return (
                    <tr 
                      key={ges.id} 
                      onClick={() => router.push(`/gestiones/${ges.id}`)}
                      className={`transition-colors cursor-pointer ${
                        ges.archivada 
                          ? 'bg-slate-50/60 dark:bg-slate-900/20 hover:bg-slate-100/60' 
                          : 'hover:bg-blue-50/30 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-blue-600">
                        {ges.folio}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(ges, 'md')}
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{ges.nombre}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              📞 {ges.telefono} {ges.curp ? `• CURP: ${ges.curp.slice(0, 10)}...` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{ges.colonia || ges.municipio}</p>
                        {ges.seccionElectoral && (
                          <p className="text-[11px] text-blue-600 font-bold">Sección {ges.seccionElectoral}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <span className="inline-block text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200 mb-0.5">
                          {ges.tipo}
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 truncate font-medium">{ges.descripcion}</p>
                      </td>
                      {/* Fecha de Recepción */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300 font-semibold block">
                          {ges.fecha}
                        </span>
                      </td>
                      {/* Fecha de Finalización */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {ges.fechaResolucionDisplay ? (
                          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{ges.fechaResolucionDisplay}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">En trámite</span>
                        )}
                      </td>
                      {/* Estatus & Badge de Archivada */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEstatusBadge(ges.estatus)}`}>
                            {ges.estatus}
                          </span>
                          {ges.archivada && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-300">
                              <Archive className="h-2.5 w-2.5" />
                              <span>Archivada</span>
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Acciones */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {ges.estatus === 'Resuelta' && (
                            ges.archivada ? (
                              <button
                                type="button"
                                onClick={() => handleArchivarGestion(ges.id, false)}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Desarchivar gestión"
                              >
                                <ArchiveRestore className="h-3 w-3" />
                                <span>Desarchivar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleArchivarGestion(ges.id, true)}
                                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Archivar de la vista activa"
                              >
                                <Archive className="h-3 w-3" />
                                <span>Archivar</span>
                              </button>
                            )
                          )}

                          <Link
                            href={`/gestiones/${ges.id}`}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Expediente
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredGestiones.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-xs italic">
                      No se encontraron gestiones que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
