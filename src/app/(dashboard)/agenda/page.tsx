'use client';

import { useState, useEffect } from 'react';
import { 
  getAgendaEventos, 
  createAgendaEvento, 
  updateAgendaEvento, 
  deleteAgendaEvento,
  getAgendaSedes,
  createAgendaSede,
  deleteAgendaSede,
  getAgendaTipos,
  createAgendaTipo,
  deleteAgendaTipo,
  getGoogleCalendarStatusAction,
  disconnectGoogleCalendarAction,
  syncGoogleCalendarAction
} from '@/app/actions/agenda';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Share2, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Landmark,
  CalendarDays,
  CalendarRange,
  Building2,
  BookmarkPlus,
  Trash2,
  AlertTriangle,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ArrowRight,
  ArrowUpDown,
  RefreshCw,
  Zap,
  CheckCircle2,
  Edit3,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface EventoLegislativo {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  horaFin?: string;
  lugar: string;
  ubicacionUrl: string;
  tipo: string;
  descripcion?: string;
  incluirEnCompartir?: boolean;
}

interface SedeFrecuente {
  id: string;
  nombre: string;
  ubicacionUrl: string;
  referencia?: string;
}

const SEDES_PREDETERMINADAS: SedeFrecuente[] = [
  {
    id: 'sede-1',
    nombre: 'Congreso del Estado (Recinto Oficial de Sesiones)',
    ubicacionUrl: 'https://share.google/RSlrkI2maowYbwLnH',
    referencia: 'Pleno',
  },
  {
    id: 'sede-2',
    nombre: 'Sala de Usos Múltiples en Congreso',
    ubicacionUrl: 'https://share.google/RSlrkI2maowYbwLnH',
    referencia: 'Comisiones',
  },
  {
    id: 'sede-3',
    nombre: 'IEPCT (Instituto Electoral y de Participación Ciudadana)',
    ubicacionUrl: 'https://share.google/Ns9yO6vsSIXS4zLMR',
    referencia: 'Institucional',
  },
  {
    id: 'sede-4',
    nombre: 'Casa de Enlace Legislativo (Av. 27 de Febrero 402)',
    ubicacionUrl: 'https://maps.app.goo.gl/shareTabascoDistrito',
    referencia: 'Distrito',
  },
  {
    id: 'sede-5',
    nombre: 'SOTOP (Secretaría de Obras Públicas)',
    ubicacionUrl: 'https://maps.google.com/?q=SOTOP+Villahermosa',
    referencia: 'Gobierno',
  },
  {
    id: 'sede-6',
    nombre: 'Palacio de Gobierno del Estado',
    ubicacionUrl: 'https://maps.google.com/?q=Palacio+de+Gobierno+Villahermosa',
    referencia: 'Ejecutivo',
  },
];

const INITIAL_EVENTS: EventoLegislativo[] = [];

const TIPOS_BASE = ['Comisión', 'Pleno', 'Solemne', 'Distrito', 'Institucional', 'Medios', 'Reunión de Bancada'];

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
}

function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const val = url.trim().toLowerCase();
  
  const patterns = [
    'google.com/maps',
    'maps.google.',
    'maps.app.goo.gl',
    'goo.gl/maps',
    'share.google',
    'maps.apple.com',
    'waze.com',
    'openstreetmap.org'
  ];
  
  if (patterns.some(p => val.includes(p))) return true;

  try {
    const formatted = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
    const parsed = new URL(formatted);
    const host = parsed.hostname;
    return patterns.some(p => host.includes(p)) || parsed.pathname.includes('/maps') || parsed.pathname.includes('/place') || parsed.searchParams.has('q');
  } catch {
    return false;
  }
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 540;
  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  const clean = str.replace(/[^\d:]/g, '');
  const parts = clean.split(':');
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + (isNaN(minutes) ? 0 : minutes);
}

function getHourNumber(timeStr: string): number {
  const total = parseTimeToMinutes(timeStr);
  return Math.floor(total / 60) % 24;
}

function formatTimeTo24(timeStr: string): string {
  if (!timeStr) return '09:00';
  const total = parseTimeToMinutes(timeStr);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const total = parseTimeToMinutes(timeStr);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

const HOUR_ROW_HEIGHT = 48; // Altura en píxeles de cada franja de 1 hora (24h = 1152px)

interface PositionedEvent {
  event: EventoLegislativo;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
}

function layoutDayEvents(events: EventoLegislativo[]): PositionedEvent[] {
  if (!events || events.length === 0) return [];

  const items = events.map((ev) => {
    const startMins = parseTimeToMinutes(ev.hora);
    let endMins = ev.horaFin ? parseTimeToMinutes(ev.horaFin) : startMins + 60;
    if (endMins <= startMins) {
      endMins = Math.min(startMins + 60, 1440);
    }
    const duration = Math.max(endMins - startMins, 15);
    const top = (startMins / 60) * HOUR_ROW_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_ROW_HEIGHT, 26);
    return {
      event: ev,
      startMins,
      endMins,
      top,
      height,
    };
  });

  // Ordenar por hora de inicio ascendente, luego duraciones más largas primero
  items.sort((a, b) => a.startMins - b.startMins || (b.endMins - b.startMins) - (a.endMins - a.startMins));

  // Agrupar en grupos o clusters de eventos que se solapan en el tiempo
  const clusters: (typeof items)[] = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMins;
    } else if (item.startMins < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMins);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMins;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const columns: (typeof items)[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        if (lastInCol.endMins <= item.startMins) {
          columns[i].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([item]);
      }
    }

    const totalCols = columns.length;
    columns.forEach((col, colIdx) => {
      const leftPercent = (colIdx / totalCols) * 100;
      const widthPercent = (100 / totalCols) - (totalCols > 1 ? 1 : 0);
      for (const item of col) {
        results.push({
          event: item.event,
          top: item.top,
          height: item.height,
          leftPercent,
          widthPercent,
        });
      }
    });
  }

  return results;
}

function formatRelativeDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Hoy';
  const target = parseDate(dateStr);
  const today = parseDate(todayStr);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'Mañana';
  return target.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short' });
}

const HORAS_DEL_DIA_24 = Array.from({ length: 24 }, (_, i) => {
  const h24 = String(i).padStart(2, '0');
  const ampm = i >= 12 ? 'PM' : 'AM';
  let h12 = i % 12;
  if (h12 === 0) h12 = 12;
  return {
    hourNumber: i,
    label24: `${h24}:00`,
    label12: `${String(h12).padStart(2, '0')}:00 ${ampm}`,
    labelShort: `${h12} ${ampm}`,
    defaultTimeInput: `${h24}:00`,
  };
});

function getWeekDays(currentDateStr: string) {
  const base = parseDate(currentDateStr);
  const dayOfWeek = base.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - dayOfWeek);

  const todayFormatted = formatDate(new Date());
  const diaNombres = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNombre: diaNombres[i],
      diaNumero: d.getDate(),
      esHoy: fStr === todayFormatted,
    });
  }
  return days;
}

function getMiniCalendarDays(viewMonthDate: Date, selectedDateStr: string) {
  const year = viewMonthDate.getFullYear();
  const month = viewMonthDate.getMonth();
  
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const startDayOfWeek = firstDay.getDay(); // 0 = Domingo
  
  const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0, 12, 0, 0).getDate();
  
  const todayFormatted = formatDate(new Date());
  const days = [];
  
  // Días previos
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const diaNum = daysInPrevMonth - i;
    const d = new Date(year, month - 1, diaNum, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: diaNum,
      esMesActual: false,
      esHoy: fStr === todayFormatted,
      esSeleccionado: fStr === selectedDateStr,
    });
  }
  
  // Días actuales
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: i,
      esMesActual: true,
      esHoy: fStr === todayFormatted,
      esSeleccionado: fStr === selectedDateStr,
    });
  }
  
  // Días siguientes
  const totalCells = Math.ceil(days.length / 7) * 7;
  const remaining = totalCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: i,
      esMesActual: false,
      esHoy: fStr === todayFormatted,
      esSeleccionado: fStr === selectedDateStr,
    });
  }
  
  return days;
}

function getMonthDays(currentDateStr: string) {
  const base = parseDate(currentDateStr);
  const year = base.getFullYear();
  const month = base.getMonth();
  
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Domingo
  
  const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0, 12, 0, 0).getDate();
  
  const todayFormatted = formatDate(new Date());
  const days = [];
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const diaNum = daysInPrevMonth - i;
    const d = new Date(year, month - 1, diaNum, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: diaNum,
      esMesActual: false,
      esHoy: fStr === todayFormatted,
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: i,
      esMesActual: true,
      esHoy: fStr === todayFormatted,
    });
  }
  
  const totalCells = Math.ceil(days.length / 7) * 7;
  const remaining = totalCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i, 12, 0, 0);
    const fStr = formatDate(d);
    days.push({
      fecha: fStr,
      diaNumero: i,
      esMesActual: false,
      esHoy: fStr === todayFormatted,
    });
  }
  
  return days;
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState<EventoLegislativo[]>(INITIAL_EVENTS);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const todayStr = formatDate(new Date());
  const [sedesFrecuentes, setSedesFrecuentes] = useState<SedeFrecuente[]>(SEDES_PREDETERMINADAS);
  const [tiposEventos, setTiposEventos] = useState<string[]>(TIPOS_BASE);
  const [vista, setVista] = useState<'mes' | 'semana' | 'dia'>('semana');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(todayStr);
  const [miniCalDate, setMiniCalDate] = useState<Date>(() => parseDate(todayStr));

  // Minutos actuales del día en curso (para la línea roja de hora actual)
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Google Calendar live sync states & OAuth
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEmail, setGcalEmail] = useState('');
  const [isModalGCalOpen, setIsModalGCalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingGCal, setIsSyncingGCal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('En vivo');

  // Modals & Active selections
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [isModalCompartirOpen, setIsModalCompartirOpen] = useState(false);
  const [eventoDetalle, setEventoDetalle] = useState<EventoLegislativo | null>(null);
  const [eventoAEditar, setEventoAEditar] = useState<EventoLegislativo | null>(null);
  const [eventoAEliminar, setEventoAEliminar] = useState<EventoLegislativo | null>(null);
  const [sedeAEliminar, setSedeAEliminar] = useState<SedeFrecuente | null>(null);
  const [tipoAEliminar, setTipoAEliminar] = useState<string | null>(null);
  const [reagendadoPendiente, setReagendadoPendiente] = useState<{
    evento: EventoLegislativo;
    nuevaFecha: string;
    nuevaHora: string;
  } | null>(null);

  // Drag state
  const [draggedEventoId, setDraggedEventoId] = useState<string | null>(null);

  // Form states (Crear)
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(todayStr);
  const [nuevaHora, setNuevaHora] = useState('09:00');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('10:00');
  const [nuevoLugar, setNuevoLugar] = useState('');
  const [nuevaUbicacionUrl, setNuevaUbicacionUrl] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<string>('Comisión');
  const [isCustomTipo, setIsCustomTipo] = useState(false);
  const [customTipoInput, setCustomTipoInput] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState<string>('');
  const [guardarComoFrecuente, setGuardarComoFrecuente] = useState(false);

  // Form states (Editar)
  const [editTitulo, setEditTitulo] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('09:00');
  const [editHoraFin, setEditHoraFin] = useState('10:00');
  const [editLugar, setEditLugar] = useState('');
  const [editUbicacionUrl, setEditUbicacionUrl] = useState('');
  const [editTipo, setEditTipo] = useState<string>('');
  const [editIsCustomTipo, setEditIsCustomTipo] = useState(false);
  const [editCustomTipoInput, setEditCustomTipoInput] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editSedeSeleccionadaId, setEditSedeSeleccionadaId] = useState<string>('');

  const [eventosSeleccionadosIds, setEventosSeleccionadosIds] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);

  const loadAgendaData = async () => {
    try {
      const [res, resSedes, resTipos] = await Promise.all([
        getAgendaEventos(),
        getAgendaSedes(),
        getAgendaTipos(),
      ]);

      if (res.success && Array.isArray(res.data)) {
        const mapped: EventoLegislativo[] = res.data.map((d: any) => ({
          id: d.id,
          titulo: d.titulo,
          fecha: d.fecha,
          hora: d.horaInicio,
          horaFin: d.horaFin,
          lugar: d.lugarNombre,
          ubicacionUrl: d.lugarUrl || 'https://maps.google.com',
          tipo: d.tipo || 'Comisión',
          descripcion: d.notas || '',
          incluirEnCompartir: true,
        }));
        setEventos(mapped);
      } else {
        setEventos([]);
      }

      if (resSedes.success && Array.isArray(resSedes.data)) {
        const mappedSedes: SedeFrecuente[] = resSedes.data.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          ubicacionUrl: s.ubicacionUrl,
          referencia: s.referencia || undefined,
        }));
        setSedesFrecuentes(mappedSedes.length > 0 ? mappedSedes : SEDES_PREDETERMINADAS);
      }

      if (resTipos.success && Array.isArray(resTipos.data)) {
        const mappedTipos = resTipos.data.map((t: any) => t.nombre);
        setTiposEventos(mappedTipos.length > 0 ? mappedTipos : TIPOS_BASE);
      }
    } catch (err) {
      console.warn('Error loading agenda data:', err);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendaData();

    async function loadGCal() {
      try {
        const gcalRes = await getGoogleCalendarStatusAction();
        if (gcalRes.success) {
          setGcalConnected(gcalRes.connected);
          setGcalEmail(gcalRes.connected && gcalRes.email ? gcalRes.email : '');
          if (gcalRes.lastSync) {
            setLastSyncTime(
              new Date(gcalRes.lastSync).toLocaleTimeString('es-MX', {
                timeZone: 'America/Mexico_City',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }
        } else {
          setGcalConnected(false);
          setGcalEmail('');
        }
      } catch (gcalErr) {
        console.warn('Error loading gcal status:', gcalErr);
        setGcalConnected(false);
        setGcalEmail('');
      }
    }

    loadGCal();

    // Clean up any stale legacy browser cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('legislab_agenda_eventos');
      localStorage.removeItem('legislab_sedes_frecuentes');
      localStorage.removeItem('legislab_tipos_eventos');
      localStorage.removeItem('legislab_gcal_connected');
      localStorage.removeItem('legislab_gcal_email');
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gcal_status') === 'connected') {
        setToastMessage('✅ ¡Cuenta de Google Calendar conectada exitosamente!');
        setGcalConnected(true);
        setTimeout(() => setToastMessage(null), 5000);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('gcal_error')) {
        setToastMessage('⚠️ No se pudo completar la conexión con Google Calendar.');
        setTimeout(() => setToastMessage(null), 6000);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const triggerGoogleCalendarSync = () => {
    setIsSyncingGCal(true);
    if (gcalConnected) {
      syncGoogleCalendarAction().then((res) => {
        if (res.success) {
          setLastSyncTime(
            new Date().toLocaleTimeString('es-MX', {
              timeZone: 'America/Mexico_City',
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        }
        setIsSyncingGCal(false);
      });
    } else {
      setTimeout(() => {
        setIsSyncingGCal(false);
        setLastSyncTime(
          new Date().toLocaleTimeString('es-MX', {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }, 600);
    }
  };

  const handleManualSyncGCal = async () => {
    setIsSyncingGCal(true);
    try {
      const res = await syncGoogleCalendarAction();
      if (res.success) {
        setToastMessage(`✓ ${res.message}`);
        setLastSyncTime(
          new Date().toLocaleTimeString('es-MX', {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } else {
        setToastMessage(`⚠️ ${res.error}`);
      }
    } catch (e) {
      setToastMessage('⚠️ Error durante la sincronización');
    } finally {
      setIsSyncingGCal(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDisconnectGCal = async () => {
    if (!confirm('¿Deseas desconectar tu cuenta de Google Calendar de este despacho?')) return;
    try {
      const res = await disconnectGoogleCalendarAction();
      if (res.success) {
        setGcalConnected(false);
        setGcalEmail('');
        setIsModalGCalOpen(false);
        setToastMessage('✓ Google Calendar desconectado exitosamente');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const eventosFiltrados = eventos.filter((ev) => {
    if (!busqueda.trim()) return true;
    const query = busqueda.toLowerCase().trim();
    return (
      ev.titulo.toLowerCase().includes(query) ||
      ev.lugar.toLowerCase().includes(query) ||
      ev.tipo.toLowerCase().includes(query) ||
      (ev.descripcion && ev.descripcion.toLowerCase().includes(query))
    );
  });

  // Los 3 eventos más próximos a partir de hoy (orden cronológico)
  const proximosEventos = [...eventos]
    .filter((e) => e.fecha >= todayStr)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || parseTimeToMinutes(a.hora) - parseTimeToMinutes(b.hora))
    .slice(0, 3);

  const eventosDelDia = eventosFiltrados.filter((ev) => ev.fecha === fechaSeleccionada);
  const diaTieneEventos = eventosDelDia.length > 0;
  const diasSemana = getWeekDays(fechaSeleccionada);
  const diasMes = getMonthDays(fechaSeleccionada);
  const miniCalendarDays = getMiniCalendarDays(miniCalDate, fechaSeleccionada);

  const handleNavAnterior = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      cur.setDate(cur.getDate() - 1);
      const f = formatDate(cur);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    } else if (vista === 'semana') {
      cur.setDate(cur.getDate() - 7);
      const f = formatDate(cur);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    } else if (vista === 'mes') {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const day = cur.getDate();
      const maxDaysPrev = new Date(year, month, 0, 12, 0, 0).getDate();
      const targetDay = Math.min(day, maxDaysPrev);
      const targetDate = new Date(year, month - 1, targetDay, 12, 0, 0);
      const f = formatDate(targetDate);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    }
  };

  const handleNavSiguiente = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      cur.setDate(cur.getDate() + 1);
      const f = formatDate(cur);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    } else if (vista === 'semana') {
      cur.setDate(cur.getDate() + 7);
      const f = formatDate(cur);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    } else if (vista === 'mes') {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const day = cur.getDate();
      const maxDaysNext = new Date(year, month + 2, 0, 12, 0, 0).getDate();
      const targetDay = Math.min(day, maxDaysNext);
      const targetDate = new Date(year, month + 1, targetDay, 12, 0, 0);
      const f = formatDate(targetDate);
      setFechaSeleccionada(f);
      setMiniCalDate(parseDate(f));
    }
  };

  const handleOpenCompartir = () => {
    if (!diaTieneEventos) return;
    const idsDelDia = eventosDelDia.map((e) => e.id);
    setEventosSeleccionadosIds(idsDelDia);
    setIsModalCompartirOpen(true);
  };

  const handleAbrirCrearEnHora = (horaSlotInput: string, fechaTarget?: string) => {
    setNuevaFecha(fechaTarget || fechaSeleccionada);
    const formatted24 = formatTimeTo24(horaSlotInput);
    setNuevaHora(formatted24);
    
    const startMins = parseTimeToMinutes(formatted24);
    const nextMins = Math.min(startMins + 60, 1439);
    const endH = Math.floor(nextMins / 60);
    const endM = nextMins % 60;
    setNuevaHoraFin(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    
    setIsCustomTipo(false);
    setCustomTipoInput('');
    setIsModalCrearOpen(true);
  };

  // Handlers para cambio de hora con validación automática (hora_fin > hora_inicio)
  const handleNuevaHoraInicioChange = (val: string) => {
    setNuevaHora(val);
    const startMins = parseTimeToMinutes(val);
    const endMins = parseTimeToMinutes(nuevaHoraFin);
    if (endMins <= startMins) {
      const nextMins = Math.min(startMins + 60, 1439);
      const nh = Math.floor(nextMins / 60);
      const nm = nextMins % 60;
      setNuevaHoraFin(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
    }
  };

  const handleEditHoraInicioChange = (val: string) => {
    setEditHora(val);
    const startMins = parseTimeToMinutes(val);
    const endMins = parseTimeToMinutes(editHoraFin);
    if (endMins <= startMins) {
      const nextMins = Math.min(startMins + 60, 1439);
      const nh = Math.floor(nextMins / 60);
      const nm = nextMins % 60;
      setEditHoraFin(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
    }
  };

  const handleAbrirEditar = (ev: EventoLegislativo) => {
    setEventoAEditar(ev);
    setEditTitulo(ev.titulo);
    setEditFecha(ev.fecha);
    const start24 = formatTimeTo24(ev.hora);
    setEditHora(start24);
    
    let end24 = ev.horaFin ? formatTimeTo24(ev.horaFin) : '';
    if (!end24 || parseTimeToMinutes(end24) <= parseTimeToMinutes(start24)) {
      const sMins = parseTimeToMinutes(start24);
      const nextMins = Math.min(sMins + 60, 1439);
      const nh = Math.floor(nextMins / 60);
      const nm = nextMins % 60;
      end24 = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    }
    setEditHoraFin(end24);
    setEditLugar(ev.lugar);
    setEditUbicacionUrl(ev.ubicacionUrl);
    setEditTipo(ev.tipo);
    setEditIsCustomTipo(false);
    setEditCustomTipoInput('');
    setEditDescripcion(ev.descripcion || '');
    
    const match = sedesFrecuentes.find(s => s.nombre.toLowerCase() === ev.lugar.toLowerCase());
    setEditSedeSeleccionadaId(match ? match.id : 'personalizada');
  };

  const handleSeleccionarSedeFrecuente = (sedeId: string, isEdit = false) => {
    if (isEdit) {
      setEditSedeSeleccionadaId(sedeId);
      if (sedeId === 'personalizada') return;
      const sede = sedesFrecuentes.find((s) => s.id === sedeId);
      if (sede) {
        setEditLugar(sede.nombre);
        setEditUbicacionUrl(sede.ubicacionUrl);
      }
    } else {
      setSedeSeleccionadaId(sedeId);
      if (sedeId === 'personalizada') return;
      const sede = sedesFrecuentes.find((s) => s.id === sedeId);
      if (sede) {
        setNuevoLugar(sede.nombre);
        setNuevaUbicacionUrl(sede.ubicacionUrl);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, ev: EventoLegislativo) => {
    e.dataTransfer.setData('text/plain', ev.id);
    setDraggedEventoId(ev.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFecha: string, targetHora: string) => {
    e.preventDefault();
    const eventoId = e.dataTransfer.getData('text/plain') || draggedEventoId;
    if (!eventoId) return;

    const ev = eventos.find((item) => item.id === eventoId);
    if (!ev) return;

    if (ev.fecha === targetFecha && ev.hora.startsWith(targetHora.slice(0, 2))) {
      setDraggedEventoId(null);
      return;
    }

    setReagendadoPendiente({
      evento: ev,
      nuevaFecha: targetFecha,
      nuevaHora: targetHora,
    });
    setDraggedEventoId(null);
  };

  const handleConfirmarReagendado = async () => {
    if (!reagendadoPendiente) return;
    const { evento, nuevaFecha, nuevaHora } = reagendadoPendiente;

    const startMins = parseTimeToMinutes(nuevaHora);
    const prevDuration = evento.horaFin
      ? Math.max(parseTimeToMinutes(evento.horaFin) - parseTimeToMinutes(evento.hora), 15)
      : 60;
    const nextMins = Math.min(startMins + prevDuration, 1439);
    const endH = Math.floor(nextMins / 60);
    const endM = nextMins % 60;
    const nuevaHoraFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const updatedEvents = eventos.map((ev) => {
      if (ev.id === evento.id) {
        return {
          ...ev,
          fecha: nuevaFecha,
          hora: nuevaHora,
          horaFin: nuevaHoraFin,
        };
      }
      return ev;
    });

    setEventos(updatedEvents);

    if (eventoDetalle && eventoDetalle.id === evento.id) {
      setEventoDetalle({
        ...eventoDetalle,
        fecha: nuevaFecha,
        hora: nuevaHora,
        horaFin: nuevaHoraFin,
      });
    }

    setReagendadoPendiente(null);
    triggerGoogleCalendarSync();

    try {
      await updateAgendaEvento(evento.id, {
        fecha: nuevaFecha,
        horaInicio: nuevaHora,
        horaFin: nuevaHoraFin,
      });
    } catch (e) {
      console.warn('Error persisting reschedule to database:', e);
    }
  };

  const toggleSelectEvento = (id: string) => {
    if (eventosSeleccionadosIds.includes(id)) {
      setEventosSeleccionadosIds(eventosSeleccionadosIds.filter((item) => item !== id));
    } else {
      setEventosSeleccionadosIds([...eventosSeleccionadosIds, id]);
    }
  };

  const toggleSelectTodos = () => {
    if (eventosSeleccionadosIds.length === eventosDelDia.length) {
      setEventosSeleccionadosIds([]);
    } else {
      setEventosSeleccionadosIds(eventosDelDia.map((e) => e.id));
    }
  };

  const generarTextoWhatsApp = () => {
    const eventosACompartir = eventosDelDia.filter((e) => eventosSeleccionadosIds.includes(e.id));
    if (eventosACompartir.length === 0) return 'No hay eventos seleccionados para compartir.';

    const partesFecha = fechaSeleccionada.split('-');
    const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;

    let texto = `*AGENDA LEGISLATIVA - ${fechaFormateada}*\n`;
    texto += `*Dip. Ruben Roque - LXVI Legislatura*\n\n`;

    eventosACompartir.forEach((ev, idx) => {
      texto += `🟢 *${ev.titulo}*\n`;
      texto += `⏰ ${formatTimeDisplay(ev.hora)}${ev.horaFin ? ` - ${formatTimeDisplay(ev.horaFin)}` : ''}\n`;
      texto += `Lugar: ${ev.lugar}\n`;
      texto += `📍 ${ev.ubicacionUrl}\n`;
      if (idx < eventosACompartir.length - 1) {
        texto += `\n`;
      }
    });

    return texto;
  };

  const handleCompartirWhatsAppDirecto = () => {
    const texto = generarTextoWhatsApp();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleCopiarWhatsApp = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleConfirmarEliminar = async () => {
    if (!eventoAEliminar) return;
    const toDeleteId = eventoAEliminar.id;
    const updated = eventos.filter((e) => e.id !== toDeleteId);
    setEventos(updated);
    if (eventoDetalle && eventoDetalle.id === toDeleteId) {
      setEventoDetalle(null);
    }
    setEventoAEliminar(null);
    triggerGoogleCalendarSync();

    try {
      await deleteAgendaEvento(toDeleteId);
    } catch (e) {
      console.warn('Error deleting event from db:', e);
    }
  };

  const handleConfirmarEliminarSede = async () => {
    if (!sedeAEliminar) return;
    const toDelete = sedeAEliminar;
    const updated = sedesFrecuentes.filter((s) => s.id !== toDelete.id);
    setSedesFrecuentes(updated);
    if (sedeSeleccionadaId === toDelete.id) setSedeSeleccionadaId('');
    if (editSedeSeleccionadaId === toDelete.id) setEditSedeSeleccionadaId('personalizada');
    setSedeAEliminar(null);

    try {
      await deleteAgendaSede(toDelete.id);
    } catch (err) {
      console.warn('Error deleting sede from db:', err);
    }
  };

  const handleConfirmarEliminarTipo = async () => {
    if (!tipoAEliminar) return;
    const toDelete = tipoAEliminar;
    const updated = tiposEventos.filter((t) => t !== toDelete);
    setTiposEventos(updated);
    if (nuevoTipo === toDelete) setNuevoTipo(updated[0] || 'Comisión');
    if (editTipo === toDelete) setEditTipo(updated[0] || 'Comisión');
    setTipoAEliminar(null);

    try {
      await deleteAgendaTipo(toDelete);
    } catch (err) {
      console.warn('Error deleting tipo from db:', err);
    }
  };

  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoLugar.trim() || !nuevaUbicacionUrl.trim()) {
      alert('Por favor completa todos los campos obligatorios (Nombre del evento, Lugar y Ubicación).');
      return;
    }

    // Validación de horas obligatoria
    if (parseTimeToMinutes(nuevaHoraFin) <= parseTimeToMinutes(nuevaHora)) {
      alert('La hora de término debe ser mayor a la hora de inicio.');
      return;
    }

    if (!isValidGoogleMapsUrl(nuevaUbicacionUrl.trim())) {
      alert('Por favor ingresa un enlace válido de Google Maps (ej: https://maps.app.goo.gl/... o https://maps.google.com/...).');
      return;
    }

    let tipoFinal = nuevoTipo;
    if (isCustomTipo) {
      const customTrimmed = customTipoInput.trim();
      if (!customTrimmed) {
        alert('Por favor especifica el nombre del nuevo tipo de evento.');
        return;
      }
      tipoFinal = customTrimmed;
      if (!tiposEventos.includes(tipoFinal)) {
        const updatedTipos = [...tiposEventos, tipoFinal];
        setTiposEventos(updatedTipos);

        try {
          createAgendaTipo({ nombre: tipoFinal });
        } catch (err) {
          console.warn('Error saving tipo to db:', err);
        }
      }
    }

    if (guardarComoFrecuente && nuevoLugar.trim() && nuevaUbicacionUrl.trim()) {
      const yaExiste = sedesFrecuentes.some(
        (s) => s.nombre.toLowerCase() === nuevoLugar.trim().toLowerCase()
      );
      if (!yaExiste) {
        const tempSedeId = `sede-${Date.now()}`;
        const newSedeObj: SedeFrecuente = {
          id: tempSedeId,
          nombre: nuevoLugar.trim(),
          ubicacionUrl: nuevaUbicacionUrl.trim(),
          referencia: tipoFinal,
        };
        const updatedSedes = [...sedesFrecuentes, newSedeObj];
        setSedesFrecuentes(updatedSedes);

        try {
          createAgendaSede({
            nombre: nuevoLugar.trim(),
            ubicacionUrl: nuevaUbicacionUrl.trim(),
            referencia: tipoFinal,
          }).then((res) => {
            if (res.success && res.data) {
              setSedesFrecuentes((prev) =>
                prev.map((s) =>
                  s.id === tempSedeId
                    ? {
                        id: res.data.id,
                        nombre: res.data.nombre,
                        ubicacionUrl: res.data.ubicacionUrl,
                        referencia: res.data.referencia || undefined,
                      }
                    : s
                )
              );
            }
          });
        } catch (err) {
          console.warn('Error saving sede to db:', err);
        }
      }
    }

    const tempId = `ev-${Date.now()}`;
    const nuevo: EventoLegislativo = {
      id: tempId,
      titulo: nuevoTitulo.trim(),
      fecha: nuevaFecha,
      hora: nuevaHora,
      horaFin: nuevaHoraFin,
      lugar: nuevoLugar.trim(),
      ubicacionUrl: nuevaUbicacionUrl.trim(),
      tipo: tipoFinal,
      descripcion: nuevaDescripcion.trim(),
      incluirEnCompartir: true,
    };

    const nextEvents = [...eventos, nuevo];
    setEventos(nextEvents);
    setFechaSeleccionada(nuevaFecha);
    setMiniCalDate(parseDate(nuevaFecha));
    setNuevoTitulo('');
    setNuevoLugar('');
    setNuevaUbicacionUrl('');
    setNuevaDescripcion('');
    setSedeSeleccionadaId('');
    setIsCustomTipo(false);
    setCustomTipoInput('');
    setGuardarComoFrecuente(false);
    setIsModalCrearOpen(false);
    triggerGoogleCalendarSync();

    try {
      const res = await createAgendaEvento({
        titulo: nuevo.titulo,
        tipo: nuevo.tipo,
        fecha: nuevo.fecha,
        horaInicio: nuevo.hora,
        horaFin: nuevo.horaFin || nuevo.hora,
        lugarNombre: nuevo.lugar,
        lugarUrl: nuevo.ubicacionUrl,
        notas: nuevo.descripcion,
      });
      if (res.success && res.data?.id) {
        setEventos((prev) =>
          prev.map((item) => (item.id === tempId ? { ...item, id: res.data.id } : item))
        );
      }
    } catch (e) {
      console.warn('Error saving event to database:', e);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoAEditar) return;
    if (!editTitulo.trim() || !editLugar.trim() || !editUbicacionUrl.trim()) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    // Validación de horas obligatoria
    if (parseTimeToMinutes(editHoraFin) <= parseTimeToMinutes(editHora)) {
      alert('La hora de término debe ser mayor a la hora de inicio.');
      return;
    }

    if (!isValidGoogleMapsUrl(editUbicacionUrl.trim())) {
      alert('Por favor ingresa un enlace válido de Google Maps (ej: https://maps.app.goo.gl/... o https://maps.google.com/...).');
      return;
    }

    let tipoFinal = editTipo;
    if (editIsCustomTipo) {
      const customTrimmed = editCustomTipoInput.trim();
      if (!customTrimmed) {
        alert('Por favor especifica el nombre del nuevo tipo.');
        return;
      }
      tipoFinal = customTrimmed;
      if (!tiposEventos.includes(tipoFinal)) {
        const updatedTipos = [...tiposEventos, tipoFinal];
        setTiposEventos(updatedTipos);

        try {
          createAgendaTipo({ nombre: tipoFinal });
        } catch (err) {
          console.warn('Error saving tipo to db:', err);
        }
      }
    }

    const updatedEvent: EventoLegislativo = {
      ...eventoAEditar,
      titulo: editTitulo.trim(),
      fecha: editFecha,
      hora: editHora,
      horaFin: editHoraFin,
      lugar: editLugar.trim(),
      ubicacionUrl: editUbicacionUrl.trim(),
      tipo: tipoFinal,
      descripcion: editDescripcion.trim(),
    };

    const nextEvents = eventos.map((ev) => (ev.id === eventoAEditar.id ? updatedEvent : ev));
    setEventos(nextEvents);
    setEventoDetalle(updatedEvent);
    setEventoAEditar(null);
    triggerGoogleCalendarSync();

    try {
      await updateAgendaEvento(eventoAEditar.id, {
        titulo: updatedEvent.titulo,
        tipo: updatedEvent.tipo,
        fecha: updatedEvent.fecha,
        horaInicio: updatedEvent.hora,
        horaFin: updatedEvent.horaFin || updatedEvent.hora,
        lugarNombre: updatedEvent.lugar,
        lugarUrl: updatedEvent.ubicacionUrl,
        notas: updatedEvent.descripcion,
      });
    } catch (e) {
      console.warn('Error updating event in database:', e);
    }
  };

  const getGoogleEventColor = (tipo: string) => {
    switch (tipo) {
      case 'Pleno':
        return {
          bg: 'bg-[#039be5]/10 hover:bg-[#039be5]/20 border-l-[4px] border-l-[#039be5] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#039be5] text-white',
          text: 'text-[#0277bd] dark:text-[#29b6f6]',
          dot: 'bg-[#039be5]',
        };
      case 'Comisión':
        return {
          bg: 'bg-[#0b8043]/10 hover:bg-[#0b8043]/20 border-l-[4px] border-l-[#0b8043] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#0b8043] text-white',
          text: 'text-[#0b8043] dark:text-[#66bb6a]',
          dot: 'bg-[#0b8043]',
        };
      case 'Solemne':
        return {
          bg: 'bg-[#8e24aa]/10 hover:bg-[#8e24aa]/20 border-l-[4px] border-l-[#8e24aa] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#8e24aa] text-white',
          text: 'text-[#6a1b9a] dark:text-[#ab47bc]',
          dot: 'bg-[#8e24aa]',
        };
      case 'Distrito':
        return {
          bg: 'bg-[#f4511e]/10 hover:bg-[#f4511e]/20 border-l-[4px] border-l-[#f4511e] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#f4511e] text-white',
          text: 'text-[#d84315] dark:text-[#ff7043]',
          dot: 'bg-[#f4511e]',
        };
      case 'Institucional':
        return {
          bg: 'bg-[#f6bf26]/15 hover:bg-[#f6bf26]/25 border-l-[4px] border-l-[#f6bf26] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#f6bf26] text-gray-900',
          text: 'text-[#b78103] dark:text-[#fbc02d]',
          dot: 'bg-[#f6bf26]',
        };
      case 'Medios':
        return {
          bg: 'bg-[#d50000]/10 hover:bg-[#d50000]/20 border-l-[4px] border-l-[#d50000] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#d50000] text-white',
          text: 'text-[#c51162] dark:text-[#ff4081]',
          dot: 'bg-[#d50000]',
        };
      default:
        return {
          bg: 'bg-[#3f51b5]/10 hover:bg-[#3f51b5]/20 border-l-[4px] border-l-[#3f51b5] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#3f51b5] text-white',
          text: 'text-[#283593] dark:text-[#7986cb]',
          dot: 'bg-[#3f51b5]',
        };
    }
  };

  const getTituloNavegacion = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      return cur.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (vista === 'semana') {
      const dias = getWeekDays(fechaSeleccionada);
      const primero = parseDate(dias[0].fecha);
      const ultimo = parseDate(dias[6].fecha);
      return `${primero.getDate()} ${primero.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', month: 'short' })} – ${ultimo.getDate()} ${ultimo.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', month: 'short', year: 'numeric' })}`;
    }
    return cur.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* iOS Large Title Header */}
      <div className="space-y-0.5 pt-1 pb-1">
        <h1 className="text-ios-large-title font-bold text-[#0B172D] tracking-tight">
          Agenda Parlamentaria
        </h1>
        <p className="text-ios-subhead text-[#8E8E93]">
          Calendario institucional, sesiones, comisiones y eventos en territorio
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start font-sans text-[#0B172D]">
        
        {/* SIDEBAR IZQUIERDA ESTILO GOOGLE CALENDAR / iOS HIG */}
        <aside className="w-full lg:w-60 shrink-0 space-y-4">
        {/* Botón + Crear Google Monochrome */}
        <button
          type="button"
          onClick={() => {
            setNuevaFecha(fechaSeleccionada);
            setNuevaHora('09:00');
            setNuevaHoraFin('10:00');
            setIsCustomTipo(false);
            setCustomTipoInput('');
            setIsModalCrearOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center gap-2.5 bg-white dark:bg-[#121824] hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-800 dark:text-gray-100 font-semibold px-5 py-2.5 rounded-full border border-gray-300/90 dark:border-gray-700 shadow-xs hover:shadow-sm transition-all text-sm group cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gray-700 dark:text-gray-200 shrink-0" />
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Crear</span>
        </button>

        {/* Mini Calendario de Navegación */}
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 capitalize">
              {miniCalDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(miniCalDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setMiniCalDate(prev);
                }}
                title="Mes anterior"
                className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(miniCalDate);
                  next.setMonth(next.getMonth() + 1);
                  setMiniCalDate(next);
                }}
                title="Mes siguiente"
                className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Encabezado D L M M J V S */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
            <span>D</span>
            <span>L</span>
            <span>M</span>
            <span>M</span>
            <span>J</span>
            <span>V</span>
            <span>S</span>
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {miniCalendarDays.map((cell) => {
              const isSelected = fechaSeleccionada === cell.fecha;
              return (
                <button
                  key={cell.fecha}
                  type="button"
                  onClick={() => {
                    setFechaSeleccionada(cell.fecha);
                    setMiniCalDate(parseDate(cell.fecha));
                  }}
                  className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center text-[10px] sm:text-[11px] transition-all font-medium ${
                    isSelected
                      ? 'bg-[#1a73e8] text-white font-bold shadow-xs'
                      : cell.esHoy
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-[#1a73e8] font-bold'
                      : cell.esMesActual
                      ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'
                  }`}
                >
                  {cell.diaNumero}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buscar Personas o Eventos */}
        <div className="relative">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar personas o eventos..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#121824] border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Próximos 3 Eventos Widget */}
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
              Próximos eventos
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300">
              {proximosEventos.length}
            </span>
          </div>

          {proximosEventos.length > 0 ? (
            <div className="space-y-2">
              {proximosEventos.map((ev) => {
                const style = getGoogleEventColor(ev.tipo);
                const relDate = formatRelativeDate(ev.fecha, todayStr);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setFechaSeleccionada(ev.fecha);
                      setMiniCalDate(parseDate(ev.fecha));
                      setEventoDetalle(ev);
                    }}
                    className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-[#1a73e8] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded-md">
                        {relDate}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${style.chip}`}>
                        {ev.tipo}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1 group-hover:text-[#1a73e8] transition-colors">
                      {ev.titulo}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 pt-0.5">
                      <span className="font-mono">{formatTimeDisplay(ev.hora)}</span>
                      <span className="truncate max-w-[100px] text-right">{ev.lugar}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic text-center py-2">
              No hay eventos próximos agendados.
            </p>
          )}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DEL CALENDARIO */}
      <main className="flex-1 min-w-0 w-full space-y-3">
        {/* Barra Superior Google Calendar */}
        <div className="bg-white dark:bg-[#121824] px-3.5 sm:px-5 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-2.5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
          
          {/* Fila 1: Hoy + Flechas + Título */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  const today = formatDate(new Date());
                  setFechaSeleccionada(today);
                  setMiniCalDate(parseDate(today));
                }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-2xs shrink-0"
              >
                Hoy
              </button>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={handleNavAnterior}
                  title="Anterior"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNavSiguiente}
                  title="Siguiente"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h2 className="text-xs sm:text-base font-semibold text-gray-800 dark:text-gray-100 capitalize tracking-tight truncate max-w-[170px] sm:max-w-none text-right sm:text-left ml-1">
              {getTituloNavegacion()}
            </h2>
          </div>

          {/* Fila 2: Selector Vista + Badge Sync + Compartir */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/60">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/90 p-0.5 sm:p-1 rounded-xl text-xs font-semibold border border-gray-200/80 dark:border-gray-800/60 shrink-0">
              <button
                onClick={() => setVista('dia')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  vista === 'dia'
                    ? 'bg-white dark:bg-gray-700 text-[#1a73e8] dark:text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setVista('semana')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  vista === 'semana'
                    ? 'bg-white dark:bg-gray-700 text-[#1a73e8] dark:text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setVista('mes')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  vista === 'mes'
                    ? 'bg-white dark:bg-gray-700 text-[#1a73e8] dark:text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Mes
              </button>
            </div>

            {/* Google Calendar Status & Connect Button */}
            {gcalConnected ? (
              <button
                onClick={() => setIsModalGCalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-medium text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-2xs cursor-pointer group"
                title="Administrar Google Calendar"
              >
                <div className={`h-2 w-2 rounded-full ${isSyncingGCal ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'}`}></div>
                <span className="font-bold">Google Calendar:</span>
                <span className="text-emerald-700 dark:text-emerald-300 truncate max-w-[130px]">
                  {isSyncingGCal ? 'Sincronizando...' : gcalEmail || 'Conectado'}
                </span>
                <RefreshCw className={`h-3 w-3 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity ${isSyncingGCal ? 'animate-spin' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => setIsModalGCalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-[#1a73e8] dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Conectar Google Calendar</span>
              </button>
            )}

            <button
              onClick={handleOpenCompartir}
              disabled={!diaTieneEventos}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                diaTieneEventos
                  ? 'bg-[#0b8043] hover:bg-[#096e38] text-white shadow-sm cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200/80 dark:border-gray-800 cursor-not-allowed opacity-60'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compartir agenda</span>
              <span className="sm:hidden">Compartir</span>
            </button>
          </div>
        </div>

        {/* 1. VISTA DIARIA (24 HORAS CON DURACIÓN EXACTA) */}
        {vista === 'dia' && (
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
            <div className="p-2.5 sm:p-3 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium px-3 sm:px-4">
              <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
                <span className="font-bold text-gray-800 dark:text-gray-100 capitalize truncate">
                  {new Date(`${fechaSeleccionada}T12:00:00`).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="hidden sm:inline">• GMT-06 (América/México)</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">{eventosDelDia.length} eventos</span>
            </div>

            <div className="max-h-[75vh] overflow-y-auto flex relative">
              {/* Columna de Horas a la izquierda */}
              <div className="w-14 sm:w-20 md:w-24 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20 select-none">
                {HORAS_DEL_DIA_24.map((slot) => (
                  <div
                    key={slot.hourNumber}
                    style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                    className="flex items-start justify-end pr-2 pt-1 border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 dark:text-gray-500">
                      {slot.labelShort}
                    </span>
                  </div>
                ))}
              </div>

              {/* Canvas de franjas y eventos posicionados absolutamente */}
              <div
                className="relative flex-1"
                style={{ height: `${24 * HOUR_ROW_HEIGHT}px` }}
              >
                {/* Franjas horarias de fondo */}
                {HORAS_DEL_DIA_24.map((slot) => (
                  <div
                    key={slot.hourNumber}
                    style={{
                      top: `${slot.hourNumber * HOUR_ROW_HEIGHT}px`,
                      height: `${HOUR_ROW_HEIGHT}px`,
                    }}
                    onClick={() => handleAbrirCrearEnHora(slot.defaultTimeInput, fechaSeleccionada)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, fechaSeleccionada, slot.defaultTimeInput)}
                    className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                  >
                    <span className="hidden group-hover:inline-block absolute right-3 top-2 text-[10px] font-medium text-[#1a73e8] bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 shadow-2xs">
                      + Agendar a las {slot.labelShort}
                    </span>
                  </div>
                ))}

                {/* Línea roja de hora actual */}
                {fechaSeleccionada === todayStr && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${(nowMinutes / 60) * HOUR_ROW_HEIGHT}px` }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shadow-xs shrink-0"></div>
                    <div className="h-[2px] flex-1 bg-red-500"></div>
                  </div>
                )}

                {/* Eventos con duración y posicionamiento real */}
                {layoutDayEvents(eventosDelDia).map((item) => {
                  const ev = item.event;
                  const style = getGoogleEventColor(ev.tipo);
                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, fechaSeleccionada, ev.hora)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEventoDetalle(ev);
                      }}
                      style={{
                        top: `${item.top}px`,
                        height: `${item.height}px`,
                        left: `${item.leftPercent}%`,
                        width: `${item.widthPercent}%`,
                      }}
                      className={`absolute z-10 p-2 sm:p-2.5 rounded-xl ${style.bg} border-l-[4px] shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col justify-between group/ev`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-2 w-2 rounded-full ${style.dot} shrink-0`}></span>
                            <h3 className={`text-xs sm:text-sm font-bold ${style.text} truncate leading-tight`}>
                              {ev.titulo}
                            </h3>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover/ev:opacity-100 transition-opacity shrink-0 bg-white/80 dark:bg-gray-900/80 p-0.5 rounded-md">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirEditar(ev);
                              }}
                              title="Editar evento"
                              className="p-1 text-gray-600 dark:text-gray-300 hover:text-[#1a73e8] rounded hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventoAEliminar(ev);
                              }}
                              title="Eliminar evento"
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {item.height >= 44 && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-300 pt-1 font-medium truncate">
                            <span className="flex items-center gap-1 shrink-0 font-mono">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatTimeDisplay(ev.hora)} {ev.horaFin ? `– ${formatTimeDisplay(ev.horaFin)}` : ''}
                            </span>
                            {ev.lugar && (
                              <span className="flex items-center gap-1 truncate max-w-[180px]">
                                <Landmark className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="truncate">{ev.lugar}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {item.height >= 70 && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-800/40 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${style.chip}`}>
                            {ev.tipo}
                          </span>
                          <a
                            href={ev.ubicacionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline font-medium"
                          >
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span>Mapa</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. VISTA SEMANAL (7 DÍAS CON DURACIÓN CONTINUA GOOGLE CALENDAR) */}
        {vista === 'semana' && (
          <div className="space-y-2">
            <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-x-auto">
              <div className="min-w-[840px] sm:min-w-[960px]">
                {/* Encabezado de columnas: GMT-06 y DOM a SÁB */}
                <div className="grid grid-cols-8 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 text-center sticky top-0 z-30">
                  <div className="p-3 border-r border-gray-200/80 dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    GMT-06
                  </div>
                  {diasSemana.map((col) => (
                    <div
                      key={col.fecha}
                      onClick={() => {
                        setFechaSeleccionada(col.fecha);
                        setMiniCalDate(parseDate(col.fecha));
                      }}
                      className={`p-2.5 border-r border-gray-200/80 dark:border-gray-800 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${
                        fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/50 dark:bg-blue-950/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800/70'
                      }`}
                    >
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${col.esHoy ? 'text-[#1a73e8]' : 'text-gray-500 dark:text-gray-400'}`}>
                        {col.diaNombre}
                      </span>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          col.esHoy
                            ? 'bg-[#1a73e8] text-white shadow-xs'
                            : fechaSeleccionada === col.fecha
                            ? 'bg-blue-100 dark:bg-gray-700 text-[#1a73e8] dark:text-white font-bold'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {col.diaNumero}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cuadrícula de 24 horas continua */}
                <div className="max-h-[75vh] overflow-y-auto grid grid-cols-8 relative">
                  {/* Columna 1: Horas */}
                  <div className="border-r border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20 select-none">
                    {HORAS_DEL_DIA_24.map((slot) => (
                      <div
                        key={slot.hourNumber}
                        style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                        className="flex items-start justify-end pr-2 pt-1 border-b border-gray-100 dark:border-gray-800/50"
                      >
                        <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 dark:text-gray-500">
                          {slot.labelShort}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Columnas 2 a 8: Días de la semana */}
                  {diasSemana.map((col) => {
                    const dayEvents = eventosFiltrados.filter((e) => e.fecha === col.fecha);
                    const positionedDayEvents = layoutDayEvents(dayEvents);

                    return (
                      <div
                        key={col.fecha}
                        className={`relative border-r border-gray-100 dark:border-gray-800 ${
                          fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/10 dark:bg-blue-950/10' : ''
                        }`}
                        style={{ height: `${24 * HOUR_ROW_HEIGHT}px` }}
                      >
                        {/* Franjas horarias de fondo */}
                        {HORAS_DEL_DIA_24.map((slot) => (
                          <div
                            key={slot.hourNumber}
                            style={{
                              top: `${slot.hourNumber * HOUR_ROW_HEIGHT}px`,
                              height: `${HOUR_ROW_HEIGHT}px`,
                            }}
                            onClick={() => {
                              setFechaSeleccionada(col.fecha);
                              handleAbrirCrearEnHora(slot.defaultTimeInput, col.fecha);
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.fecha, slot.defaultTimeInput)}
                            className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800/60 hover:bg-[#e8f0fe]/25 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                          />
                        ))}

                        {/* Línea de hora actual */}
                        {col.esHoy && (
                          <div
                            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                            style={{ top: `${(nowMinutes / 60) * HOUR_ROW_HEIGHT}px` }}
                          >
                            <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-xs shrink-0"></div>
                            <div className="h-[2px] flex-1 bg-red-500"></div>
                          </div>
                        )}

                        {/* Eventos posicionados */}
                        {positionedDayEvents.map((item) => {
                          const ev = item.event;
                          const style = getGoogleEventColor(ev.tipo);
                          return (
                            <div
                              key={ev.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, ev)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, col.fecha, ev.hora)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventoDetalle(ev);
                              }}
                              style={{
                                top: `${item.top}px`,
                                height: `${item.height}px`,
                                left: `${item.leftPercent}%`,
                                width: `${item.widthPercent}%`,
                              }}
                              className={`absolute z-10 p-1 sm:p-1.5 rounded-lg ${style.bg} border-l-[3px] shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing overflow-hidden group/week-ev`}
                            >
                              <div className="flex items-start justify-between gap-0.5">
                                <p className={`font-bold ${style.text} text-[10px] sm:text-[11px] truncate leading-tight`}>
                                  {ev.titulo}
                                </p>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/week-ev:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAbrirEditar(ev);
                                    }}
                                    title="Editar"
                                    className="p-0.5 text-gray-500 hover:text-[#1a73e8] rounded hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEventoAEliminar(ev);
                                    }}
                                    title="Eliminar"
                                    className="p-0.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[9px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">
                                {formatTimeDisplay(ev.hora)} {ev.horaFin ? `– ${formatTimeDisplay(ev.horaFin)}` : ''}
                              </p>

                              {item.height >= 48 && ev.lugar && (
                                <p className="text-[9px] text-gray-600 dark:text-gray-300 truncate mt-0.5">
                                  {ev.lugar}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. VISTA MENSUAL */}
        {vista === 'mes' && (
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-2.5 sm:p-4 space-y-2 sm:space-y-3">
            <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-1 border-b border-gray-100 dark:border-gray-800">
              <span>DOM</span>
              <span>LUN</span>
              <span>MAR</span>
              <span>MIÉ</span>
              <span>JUE</span>
              <span>VIE</span>
              <span>SÁB</span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {diasMes.map((cell) => {
                const fStr = cell.fecha;
                const evs = eventosFiltrados.filter((e) => e.fecha === fStr);
                const isSelected = fechaSeleccionada === fStr;
                const esHoy = cell.esHoy;
                const esMesActual = cell.esMesActual;

                return (
                  <div
                    key={fStr}
                    onClick={() => {
                      setFechaSeleccionada(fStr);
                      setVista('dia');
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, fStr, '09:00')}
                    className={`min-h-[60px] sm:min-h-[110px] p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1a73e8] bg-[#e8f0fe]/30 shadow-xs'
                        : esHoy
                        ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20'
                        : esMesActual
                        ? 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-transparent'
                        : 'border-gray-100 dark:border-gray-800/40 bg-gray-50/40 dark:bg-gray-900/20 opacity-45 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                          esHoy
                            ? 'bg-[#1a73e8] text-white shadow-xs'
                            : isSelected
                            ? 'text-[#1a73e8] font-bold'
                            : esMesActual
                            ? 'text-gray-700 dark:text-gray-200'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {cell.diaNumero}
                      </span>
                      {evs.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {evs.length}
                        </span>
                      )}
                    </div>

                    {/* Móvil: puntos de colores */}
                    <div className="flex sm:hidden flex-wrap gap-0.5 mt-0.5 justify-center">
                      {evs.slice(0, 3).map((e) => (
                        <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${getGoogleEventColor(e.tipo).dot}`}></span>
                      ))}
                      {evs.length > 3 && <span className="text-[8px] text-[#1a73e8] font-bold leading-none">+</span>}
                    </div>

                    {/* Escritorio: chips con texto */}
                    <div className="hidden sm:block space-y-1 mt-1 overflow-hidden">
                      {evs.slice(0, 2).map((e) => {
                        const style = getGoogleEventColor(e.tipo);
                        return (
                          <div
                            key={e.id}
                            draggable
                            onDragStart={(evt) => handleDragStart(evt, e)}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setEventoDetalle(e);
                            }}
                            className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded-md ${style.chip} shadow-2xs hover:opacity-90 flex items-center gap-1`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                            <span className="truncate">{formatTimeDisplay(e.hora).slice(0, 5)} {e.titulo}</span>
                          </div>
                        );
                      })}
                      {evs.length > 2 && (
                        <span className="text-[10px] text-[#1a73e8] font-bold block pl-1">
                          +{evs.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETALLES DEL EVENTO */}
      {eventoDetalle && !eventoAEditar && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${getGoogleEventColor(eventoDetalle.tipo).dot}`}></span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Detalles del evento</h2>
              </div>
              <button 
                onClick={() => setEventoDetalle(null)} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getGoogleEventColor(eventoDetalle.tipo).chip} mb-2`}>
                  {eventoDetalle.tipo}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {eventoDetalle.titulo}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-200">
                <div className="space-y-1">
                  <span className="text-gray-400 dark:text-gray-500 font-medium block">Fecha y Horario:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                    <Clock className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>{eventoDetalle.fecha} | {formatTimeDisplay(eventoDetalle.hora)} {eventoDetalle.horaFin ? `– ${formatTimeDisplay(eventoDetalle.horaFin)}` : ''}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 dark:text-gray-500 font-medium block">Lugar:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                    <Landmark className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>{eventoDetalle.lugar}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Ubicación (Google maps):</span>
                <a
                  href={eventoDetalle.ubicacionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[#1a73e8] text-xs font-mono font-medium hover:bg-blue-100 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="truncate flex-1">{eventoDetalle.ubicacionUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>

              {eventoDetalle.descripcion && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Notas:</span>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {eventoDetalle.descripcion}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleAbrirEditar(eventoDetalle);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1a73e8] hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar Evento</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEventoAEliminar(eventoDetalle);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEventoDetalle(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEventosSeleccionadosIds([eventoDetalle.id]);
                    setIsModalCompartirOpen(true);
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Compartir en WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR EVENTO CON VALIDACIÓN DE HORA */}
      {isModalCrearOpen && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#1a73e8]" />
                Nuevo evento
              </h2>
              <button onClick={() => setIsModalCrearOpen(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><span>← Volver al Tablero</span></button>
            </div>

            <form onSubmit={handleCrearEvento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Nombre del evento <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="Ej: 61. COMISIÓN ORDINARIA DE GOBERNACIÓN Y PUNTOS CONSTITUCIONALES"
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 dark:text-gray-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={formatTimeTo24(nuevaHora)}
                    onChange={(e) => handleNuevaHoraInicioChange(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Hora Término <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={formatTimeTo24(nuevaHoraFin)}
                    onChange={(e) => setNuevaHoraFin(e.target.value)}
                    className={`w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 font-mono ${
                      parseTimeToMinutes(nuevaHoraFin) <= parseTimeToMinutes(nuevaHora)
                        ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                        : 'border-gray-200/80 dark:border-gray-800 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {parseTimeToMinutes(nuevaHoraFin) <= parseTimeToMinutes(nuevaHora) && (
                <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 -mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  La hora de término debe ser posterior a la hora de inicio ({formatTimeTo24(nuevaHora)}).
                </p>
              )}

              {/* Lugar */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Lugar:</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Elige una ubicación frecuente o escribe abajo</span>
                </div>

                <select
                  value={sedeSeleccionadaId}
                  onChange={(e) => handleSeleccionarSedeFrecuente(e.target.value)}
                  className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Seleccionar lugar guardado --</option>
                  {sedesFrecuentes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      📍 {sede.nombre} ({sede.referencia || 'Sede'})
                    </option>
                  ))}
                  <option value="personalizada">✏️ + Otra Ubicación / Personalizada</option>
                </select>

                {sedesFrecuentes.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Lugares guardados:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {sedesFrecuentes.map((sede) => {
                        const isSelected = sedeSeleccionadaId === sede.id;
                        return (
                          <div
                            key={sede.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 text-[#1a73e8] font-bold dark:bg-blue-950/40 dark:border-blue-700 shadow-2xs'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                            onClick={() => handleSeleccionarSedeFrecuente(sede.id)}
                          >
                            <span className="truncate max-w-[180px]">📍 {sede.nombre}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSedeAEliminar(sede);
                              }}
                              title="Eliminar este lugar guardado"
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Lugar <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={nuevoLugar}
                      onChange={(e) => setNuevoLugar(e.target.value)}
                      placeholder="Ej: Sala de Usos Múltiples en Congreso"
                      className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center justify-between">
                      <span>Ubicación (Google maps) <span className="text-red-500">*</span></span>
                      {nuevaUbicacionUrl.trim() && (
                        isValidGoogleMapsUrl(nuevaUbicacionUrl) ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Enlace válido
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> URL no reconocida como Google Maps
                          </span>
                        )
                      )}
                    </label>
                    <input
                      required
                      type="url"
                      value={nuevaUbicacionUrl}
                      onChange={(e) => setNuevaUbicacionUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/... o https://maps.google.com/..."
                      className={`w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded-lg focus:ring-2 font-mono ${
                        nuevaUbicacionUrl.trim() && !isValidGoogleMapsUrl(nuevaUbicacionUrl)
                          ? 'border-amber-400 focus:ring-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-gray-200/80 dark:border-gray-800 focus:ring-blue-500 text-[#1a73e8]'
                      }`}
                    />
                  </div>

                  {nuevoLugar && nuevaUbicacionUrl && !sedesFrecuentes.some(s => s.nombre.toLowerCase() === nuevoLugar.trim().toLowerCase()) && (
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guardarComoFrecuente}
                        onChange={(e) => setGuardarComoFrecuente(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <BookmarkPlus className="h-3.5 w-3.5 text-[#1a73e8]" />
                        Guardar este lugar en ubicaciones frecuentes para futuros eventos
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Tipo de Evento (Dinámico) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Tipo de Evento
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Selecciona o crea categoría</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tiposEventos.map((t) => {
                    const isSelected = !isCustomTipo && nuevoTipo === t;
                    return (
                      <div
                        key={t}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a73e8] text-white border-[#1a73e8] font-bold shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          setIsCustomTipo(false);
                          setNuevoTipo(t);
                        }}
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipoAEliminar(t);
                          }}
                          title="Eliminar este tipo de evento"
                          className={`p-0.5 rounded transition-colors ${
                            isSelected
                              ? 'text-white/80 hover:text-white hover:bg-blue-700'
                              : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTipo(true);
                      setCustomTipoInput('');
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium ${
                      isCustomTipo ? 'bg-blue-50 dark:bg-blue-950/50 border-solid font-bold' : ''
                    }`}
                  >
                    + Nuevo tipo
                  </button>
                </div>

                {isCustomTipo && (
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#1a73e8]" />
                      <span>Escribe el nombre del nuevo tipo de evento:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={customTipoInput}
                        onChange={(e) => setCustomTipoInput(e.target.value)}
                        placeholder="Ej: Foro Ciudadano, Rueda de Prensa..."
                        className="flex-1 p-2 text-xs bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTipo(false);
                          setNuevoTipo(tiposEventos[0] || 'Comisión');
                        }}
                        className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Puntos clave, acuerdos previos, relación de invitados o documentos..."
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 dark:text-gray-100 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parseTimeToMinutes(nuevaHoraFin) <= parseTimeToMinutes(nuevaHora)}
                  className="px-5 py-2 text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  Crear evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EVENTO CON VALIDACIÓN DE HORA */}
      {eventoAEditar && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#1a73e8]" />
                Editar evento
              </h2>
              <button onClick={() => setEventoAEditar(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Nombre del evento <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 dark:text-gray-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={formatTimeTo24(editHora)}
                    onChange={(e) => handleEditHoraInicioChange(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Hora Término <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={formatTimeTo24(editHoraFin)}
                    onChange={(e) => setEditHoraFin(e.target.value)}
                    className={`w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 font-mono ${
                      parseTimeToMinutes(editHoraFin) <= parseTimeToMinutes(editHora)
                        ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                        : 'border-gray-200/80 dark:border-gray-800 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {parseTimeToMinutes(editHoraFin) <= parseTimeToMinutes(editHora) && (
                <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 -mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  La hora de término debe ser posterior a la hora de inicio ({formatTimeTo24(editHora)}).
                </p>
              )}

              {/* Lugar */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Lugar:</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Selecciona o administra lugares</span>
                </div>

                <select
                  value={editSedeSeleccionadaId}
                  onChange={(e) => handleSeleccionarSedeFrecuente(e.target.value, true)}
                  className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="personalizada">✏️ Ubicación Manual / Personalizada</option>
                  {sedesFrecuentes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      📍 {sede.nombre} ({sede.referencia || 'Sede'})
                    </option>
                  ))}
                </select>

                {sedesFrecuentes.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      Lugares guardados:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {sedesFrecuentes.map((sede) => {
                        const isSelected = editSedeSeleccionadaId === sede.id;
                        return (
                          <div
                            key={sede.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 text-[#1a73e8] font-bold dark:bg-blue-950/40 dark:border-blue-700 shadow-2xs'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                            onClick={() => handleSeleccionarSedeFrecuente(sede.id, true)}
                          >
                            <span className="truncate max-w-[180px]">📍 {sede.nombre}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSedeAEliminar(sede);
                              }}
                              title="Eliminar este lugar guardado"
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Lugar <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={editLugar}
                      onChange={(e) => setEditLugar(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center justify-between">
                      <span>Ubicación (Google maps) <span className="text-red-500">*</span></span>
                      {editUbicacionUrl.trim() && (
                        isValidGoogleMapsUrl(editUbicacionUrl) ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Enlace válido
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> URL no reconocida como Google Maps
                          </span>
                        )
                      )}
                    </label>
                    <input
                      required
                      type="url"
                      value={editUbicacionUrl}
                      onChange={(e) => setEditUbicacionUrl(e.target.value)}
                      className={`w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded-lg focus:ring-2 font-mono ${
                        editUbicacionUrl.trim() && !isValidGoogleMapsUrl(editUbicacionUrl)
                          ? 'border-amber-400 focus:ring-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-gray-200/80 dark:border-gray-800 focus:ring-blue-500 text-[#1a73e8]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Evento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Tipo de Evento
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Selecciona o administra categorías</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tiposEventos.map((t) => {
                    const isSelected = !editIsCustomTipo && editTipo === t;
                    return (
                      <div
                        key={t}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a73e8] text-white border-[#1a73e8] font-bold shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          setEditIsCustomTipo(false);
                          setEditTipo(t);
                        }}
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipoAEliminar(t);
                          }}
                          title="Eliminar este tipo de evento"
                          className={`p-0.5 rounded transition-colors ${
                            isSelected
                              ? 'text-white/80 hover:text-white hover:bg-blue-700'
                              : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsCustomTipo(true);
                      setEditCustomTipoInput('');
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium ${
                      editIsCustomTipo ? 'bg-blue-50 dark:bg-blue-950/50 border-solid font-bold' : ''
                    }`}
                  >
                    + Nuevo tipo
                  </button>
                </div>

                {editIsCustomTipo && (
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#1a73e8]" />
                      <span>Nuevo tipo de evento:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={editCustomTipoInput}
                        onChange={(e) => setEditCustomTipoInput(e.target.value)}
                        placeholder="Ej: Audiencia Pública..."
                        className="flex-1 p-2 text-xs bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditIsCustomTipo(false);
                          setEditTipo(tiposEventos[0] || 'Comisión');
                        }}
                        className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 dark:text-gray-100 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEventoAEditar(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parseTimeToMinutes(editHoraFin) <= parseTimeToMinutes(editHora)}
                  className="px-5 py-2 text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE EVENTO */}
      {eventoAEliminar && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar este evento?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  ¿Realmente desea eliminar este evento? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 text-xs space-y-1">
              <p className="font-bold text-gray-900 dark:text-white line-clamp-2">🟢 {eventoAEliminar.titulo}</p>
              <p className="text-gray-600 dark:text-gray-300">⏰ {eventoAEliminar.hora} | Lugar: {eventoAEliminar.lugar}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setEventoAEliminar(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sí, eliminar evento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE LUGAR FRECUENTE */}
      {sedeAEliminar && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar lugar frecuente?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  ¿Realmente deseas eliminar este lugar de tus ubicaciones frecuentes?
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 text-xs space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">📍 {sedeAEliminar.nombre}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">{sedeAEliminar.ubicacionUrl}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSedeAEliminar(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarSede}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sí, eliminar lugar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE TIPO DE EVENTO */}
      {tipoAEliminar && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar tipo de evento?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  ¿Realmente deseas eliminar la categoría &quot;{tipoAEliminar}&quot;?
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 text-xs">
              <p className="font-bold text-gray-900 dark:text-white">🏷️ {tipoAEliminar}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setTipoAEliminar(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarTipo}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/20 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sí, eliminar tipo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REAGENDAR EVENTO (DRAG & DROP) */}
      {reagendadoPendiente && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-[#1a73e8] shrink-0">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Desea reagendar este evento?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Se modificará la fecha y horario del compromiso y se sincronizará con Google Calendar.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-2 text-xs">
              <p className="font-bold text-gray-900 dark:text-white line-clamp-2">🟢 {reagendadoPendiente.evento.titulo}</p>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200/80 dark:border-gray-800/70">
                <div>
                  <span className="text-gray-400 dark:text-gray-500 block text-[10px]">Horario anterior:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{reagendadoPendiente.evento.fecha} | {formatTimeDisplay(reagendadoPendiente.evento.hora)}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1a73e8] mx-2 shrink-0" />
                <div>
                  <span className="text-[#1a73e8] block text-[10px] font-bold">Nuevo horario:</span>
                  <span className="font-bold text-[#1a73e8]">{reagendadoPendiente.nuevaFecha} | {formatTimeDisplay(reagendadoPendiente.nuevaHora)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setReagendadoPendiente(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarReagendado}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-sm transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Confirmar Reagendado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPARTIR AGENDA POR WHATSAPP */}
      {isModalCompartirOpen && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#0b8043] flex items-center justify-center text-white">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Compartir Agenda por WhatsApp</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Selecciona o desmarca los eventos que deseas incluir en el mensaje.</p>
                </div>
              </div>
              <button onClick={() => setIsModalCompartirOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Eventos del día ({eventosDelDia.length})
                </span>
                <button
                  onClick={toggleSelectTodos}
                  className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                >
                  {eventosSeleccionadosIds.length === eventosDelDia.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {eventosDelDia.map((ev) => {
                  const isChecked = eventosSeleccionadosIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleSelectEvento(ev.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 opacity-60'
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-emerald-600 shrink-0">
                        {isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                      </button>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">🟢 {ev.titulo}</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">⏰ {formatTimeDisplay(ev.hora)} {ev.horaFin ? `– ${formatTimeDisplay(ev.horaFin)}` : ''} | Lugar: {ev.lugar}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono truncate">📍 {ev.ubicacionUrl}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                Vista Previa del Mensaje (Formato Oficial):
              </span>

              <div className="p-4 rounded-xl bg-emerald-950/5 dark:bg-emerald-950/20 border border-emerald-500/20 font-sans text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {generarTextoWhatsApp()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleCopiarWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiado ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                <span>{copiado ? '¡Copiado al Portapapeles!' : 'Copiar Texto'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalCompartirOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleCompartirWhatsAppDirecto}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Enviar a WhatsApp Directo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GOOGLE CALENDAR */}
      {isModalGCalOpen && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-200/80 dark:border-blue-900 shadow-2xs">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Google Calendar</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Sincronización oficial bidireccional</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalGCalOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {gcalConnected ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      Cuenta Conectada
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">OAuth 2.0 Activo</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 font-mono truncate">{gcalEmail || 'Usuario Vinculado'}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Última sincronización: <span className="font-semibold text-gray-700 dark:text-gray-300">{lastSyncTime}</span>
                  </p>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Sincronización automática activada:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <li>Los eventos creados en LegisLab se reflejan al instante en tu Google Calendar.</li>
                    <li>Las modificaciones de hora, lugar y reagendado se actualizan en vivo.</li>
                    <li>Los eventos eliminados se remueven de tu cuenta Google.</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleManualSyncGCal}
                    disabled={isSyncingGCal}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingGCal ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGCal ? 'Sincronizando eventos...' : 'Forzar Sincronización Ahora'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGCal}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Desconectar Google Calendar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Conecta tu cuenta de Google Calendar para sincronizar tu agenda en tiempo real en todos tus dispositivos móviles y asistentes virtuales.
                </p>
                <a
                  href="/api/auth/google-calendar"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Conectar Cuenta de Google Calendar</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 px-4 py-3 rounded-xl shadow-2xl border border-gray-700 dark:border-gray-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
      </div>
    </div>
  );
}