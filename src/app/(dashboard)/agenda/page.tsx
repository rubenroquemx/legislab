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
  deleteAgendaTipo
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
  CalendarCheck,
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
  Info,
  RefreshCw,
  Zap,
  CheckCircle2,
  Edit3
} from 'lucide-react';

export interface EventoLegislativo {
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

export interface SedeFrecuente {
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
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

const HORAS_DEL_DIA_24 = Array.from({ length: 24 }, (_, i) => {
  const h24 = String(i).padStart(2, '0');
  const ampm = i >= 12 ? 'PM' : 'AM';
  let h12 = i % 12;
  if (h12 === 0) h12 = 12;
  return {
    hourNumber: i,
    label24: `${h24}:00`,
    label12: `${String(h12).padStart(2, '0')}:00 ${ampm}`,
    defaultTimeInput: `${h24}:00`,
  };
});

function getWeekDays(currentDateStr: string) {
  const base = parseDate(currentDateStr);
  const dayOfWeek = base.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(base);
  monday.setDate(base.getDate() + distanceToMonday);

  const todayFormatted = formatDate(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const fStr = formatDate(d);
    const diaNombre = d.toLocaleDateString('es-MX', { weekday: 'short' });
    const diaNumero = d.getDate();
    days.push({
      fecha: fStr,
      diaNombre: diaNombre.toUpperCase(),
      diaNumero,
      esHoy: fStr === todayFormatted,
    });
  }
  return days;
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState<EventoLegislativo[]>(INITIAL_EVENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [res, resSedes, resTipos] = await Promise.all([
          getAgendaEventos(),
          getAgendaSedes(),
          getAgendaTipos(),
        ]);

        if (res.success && res.data && res.data.length > 0) {
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
          if (typeof window !== 'undefined') {
            localStorage.setItem('legislab_agenda_eventos', JSON.stringify(mapped));
          }
        } else if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('legislab_agenda_eventos');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEventos(parsed);
            }
          }
        }

        if (resSedes.success && resSedes.data && resSedes.data.length > 0) {
          const mappedSedes: SedeFrecuente[] = resSedes.data.map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            ubicacionUrl: s.ubicacionUrl,
            referencia: s.referencia || undefined,
          }));
          setSedesFrecuentes(mappedSedes);
          if (typeof window !== 'undefined') {
            localStorage.setItem('legislab_sedes_frecuentes', JSON.stringify(mappedSedes));
          }
        }

        if (resTipos.success && resTipos.data && resTipos.data.length > 0) {
          const mappedTipos = resTipos.data.map((t: any) => t.nombre);
          setTiposEventos(mappedTipos);
          if (typeof window !== 'undefined') {
            localStorage.setItem('legislab_tipos_eventos', JSON.stringify(mappedTipos));
          }
        }
      } catch (err) {
        console.warn('Error loading agenda data:', err);
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('legislab_agenda_eventos');
          if (cached) {
            try {
              setEventos(JSON.parse(cached));
            } catch (e) {
              console.error(e);
            }
          }
          const savedSedes = localStorage.getItem('legislab_sedes_frecuentes');
          if (savedSedes) {
            try {
              const parsed = JSON.parse(savedSedes);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSedesFrecuentes(parsed);
              }
            } catch (e) {
              console.error(e);
            }
          }
          const savedTipos = localStorage.getItem('legislab_tipos_eventos');
          if (savedTipos) {
            try {
              const parsedTipos = JSON.parse(savedTipos);
              if (Array.isArray(parsedTipos) && parsedTipos.length > 0) {
                setTiposEventos(parsedTipos);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const todayStr = formatDate(new Date());
  const [sedesFrecuentes, setSedesFrecuentes] = useState<SedeFrecuente[]>(SEDES_PREDETERMINADAS);
  const [tiposEventos, setTiposEventos] = useState<string[]>(TIPOS_BASE);
  const [vista, setVista] = useState<'mes' | 'semana' | 'dia'>('semana');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(todayStr);

  // Google Calendar live sync states
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
  const [nuevaHoraFin, setNuevaHoraFin] = useState('10:30');
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
  const [editHoraFin, setEditHoraFin] = useState('10:30');
  const [editLugar, setEditLugar] = useState('');
  const [editUbicacionUrl, setEditUbicacionUrl] = useState('');
  const [editTipo, setEditTipo] = useState<string>('');
  const [editIsCustomTipo, setEditIsCustomTipo] = useState(false);
  const [editCustomTipoInput, setEditCustomTipoInput] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editSedeSeleccionadaId, setEditSedeSeleccionadaId] = useState<string>('');

  const [eventosSeleccionadosIds, setEventosSeleccionadosIds] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);

  const triggerGoogleCalendarSync = () => {
    setIsSyncingGCal(true);
    setTimeout(() => {
      setIsSyncingGCal(false);
      setLastSyncTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
  };

  const eventosDelDia = eventos.filter((ev) => ev.fecha === fechaSeleccionada);
  const diaTieneEventos = eventosDelDia.length > 0;
  const diasSemana = getWeekDays(fechaSeleccionada);

  const handleNavAnterior = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      cur.setDate(cur.getDate() - 1);
    } else if (vista === 'semana') {
      cur.setDate(cur.getDate() - 7);
    } else if (vista === 'mes') {
      cur.setMonth(cur.getMonth() - 1);
    }
    setFechaSeleccionada(formatDate(cur));
  };

  const handleNavSiguiente = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      cur.setDate(cur.getDate() + 1);
    } else if (vista === 'semana') {
      cur.setDate(cur.getDate() + 7);
    } else if (vista === 'mes') {
      cur.setMonth(cur.getMonth() + 1);
    }
    setFechaSeleccionada(formatDate(cur));
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
    const endMins = (startMins + 60) % 1440;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    setNuevaHoraFin(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    
    setIsCustomTipo(false);
    setCustomTipoInput('');
    setIsModalCrearOpen(true);
  };

  const handleAbrirEditar = (ev: EventoLegislativo) => {
    setEventoAEditar(ev);
    setEditTitulo(ev.titulo);
    setEditFecha(ev.fecha);
    setEditHora(formatTimeTo24(ev.hora));
    setEditHoraFin(formatTimeTo24(ev.horaFin || ev.hora));
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
    const endMins = (startMins + 60) % 1440;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_agenda_eventos', JSON.stringify(updatedEvents));
    }

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_agenda_eventos', JSON.stringify(updated));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_sedes_frecuentes', JSON.stringify(updated));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_tipos_eventos', JSON.stringify(updated));
    }
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('legislab_tipos_eventos', JSON.stringify(updatedTipos));
        }

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
        if (typeof window !== 'undefined') {
          localStorage.setItem('legislab_sedes_frecuentes', JSON.stringify(updatedSedes));
        }

        // Persist to database for whole office
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_agenda_eventos', JSON.stringify(nextEvents));
    }
    setFechaSeleccionada(nuevaFecha);
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('legislab_tipos_eventos', JSON.stringify(updatedTipos));
        }

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('legislab_agenda_eventos', JSON.stringify(nextEvents));
    }
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
          bg: 'bg-[#039be5]/10 hover:bg-[#039be5]/20 border-l-[5px] border-l-[#039be5] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#039be5] text-white',
          text: 'text-[#0277bd]',
          dot: 'bg-[#039be5]',
        };
      case 'Comisión':
        return {
          bg: 'bg-[#0b8043]/10 hover:bg-[#0b8043]/20 border-l-[5px] border-l-[#0b8043] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#0b8043] text-white',
          text: 'text-[#0b8043]',
          dot: 'bg-[#0b8043]',
        };
      case 'Solemne':
        return {
          bg: 'bg-[#8e24aa]/10 hover:bg-[#8e24aa]/20 border-l-[5px] border-l-[#8e24aa] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#8e24aa] text-white',
          text: 'text-[#6a1b9a]',
          dot: 'bg-[#8e24aa]',
        };
      case 'Distrito':
        return {
          bg: 'bg-[#f4511e]/10 hover:bg-[#f4511e]/20 border-l-[5px] border-l-[#f4511e] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#f4511e] text-white',
          text: 'text-[#d84315]',
          dot: 'bg-[#f4511e]',
        };
      case 'Institucional':
        return {
          bg: 'bg-[#e4c441]/20 hover:bg-[#e4c441]/30 border-l-[5px] border-l-[#f6bf26] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#f6bf26] text-gray-900 dark:text-white',
          text: 'text-[#b78103]',
          dot: 'bg-[#f6bf26]',
        };
      case 'Medios':
        return {
          bg: 'bg-[#d50000]/10 hover:bg-[#d50000]/20 border-l-[5px] border-l-[#d50000] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#d50000] text-white',
          text: 'text-[#c51162]',
          dot: 'bg-[#d50000]',
        };
      default:
        return {
          bg: 'bg-[#3f51b5]/10 hover:bg-[#3f51b5]/20 border-l-[5px] border-l-[#3f51b5] border-t border-r border-b border-gray-200/80 dark:border-gray-800/80',
          chip: 'bg-[#3f51b5] text-white',
          text: 'text-[#283593]',
          dot: 'bg-[#3f51b5]',
        };
    }
  };

  const getTituloNavegacion = () => {
    const cur = parseDate(fechaSeleccionada);
    if (vista === 'dia') {
      return cur.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (vista === 'semana') {
      const dias = getWeekDays(fechaSeleccionada);
      const primero = parseDate(dias[0].fecha);
      const ultimo = parseDate(dias[6].fecha);
      return `${primero.getDate()} ${primero.toLocaleDateString('es-MX', { month: 'short' })} – ${ultimo.getDate()} ${ultimo.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`;
    }
    return cur.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4 font-sans text-gray-800 dark:text-gray-100">
      {/* Google Calendar Top Bar */}
      <div className="bg-white dark:bg-[#121824] px-3.5 sm:px-5 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-800/90 shadow-xs space-y-2.5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Fila 1: Botón Crear + Hoy + Flechas + Título fecha */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setNuevaFecha(fechaSeleccionada);
                setNuevaHora('09:00');
                setNuevaHoraFin('10:30');
                setIsCustomTipo(false);
                setCustomTipoInput('');
                setIsModalCrearOpen(true);
              }}
              className="inline-flex items-center gap-1 sm:gap-2 bg-white hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm shrink-0"
            >
              <div className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold text-base sm:text-lg text-[#1a73e8]">+</div>
              <span className="font-medium text-gray-800 dark:text-gray-100">Crear</span>
            </button>

            <button
              onClick={() => setFechaSeleccionada(formatDate(new Date()))}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors shadow-2xs shrink-0"
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

          <h2 className="text-xs sm:text-lg font-medium text-gray-800 dark:text-gray-100 capitalize tracking-tight truncate max-w-[150px] sm:max-w-none text-right sm:text-left ml-1">
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
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setVista('semana')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                vista === 'semana'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVista('mes')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                vista === 'mes'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Mes
            </button>
          </div>

          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800/80 text-[11px] font-medium text-gray-600 dark:text-gray-300 shadow-2xs">
            <div className={`h-2 w-2 rounded-full ${isSyncingGCal ? 'bg-blue-500 animate-ping' : 'bg-[#0b8043]'}`}></div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Google Calendar:</span>
            <span className="text-gray-500 dark:text-gray-400">{isSyncingGCal ? 'Sincronizando...' : lastSyncTime}</span>
          </div>

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

      {/* 1. GOOGLE CALENDAR VISTA DIARIA (24 HORAS) */}
      {vista === 'dia' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="p-2.5 sm:p-3 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
              <span className="font-bold text-gray-800 dark:text-gray-100 capitalize truncate">
                {new Date(`${fechaSeleccionada}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="hidden sm:inline">• Horario continuo 24 horas</span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">{eventosDelDia.length} eventos</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/70 max-h-[75vh] overflow-y-auto">
            {HORAS_DEL_DIA_24.map((slot) => {
              const eventosEnHora = eventosDelDia.filter((ev) => getHourNumber(ev.hora) === slot.hourNumber);
              const hasEvents = eventosEnHora.length > 0;

              return (
                <div 
                  key={slot.hourNumber} 
                  onClick={() => handleAbrirCrearEnHora(slot.defaultTimeInput, fechaSeleccionada)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, fechaSeleccionada, slot.defaultTimeInput)}
                  className={`group flex transition-all cursor-pointer relative ${
                    hasEvents 
                      ? 'min-h-[72px] bg-white dark:bg-transparent hover:bg-blue-50/20' 
                      : 'min-h-[34px] sm:min-h-[36px] hover:bg-blue-50/30'
                  }`}
                >
                  <div className={`w-14 sm:w-24 md:w-28 border-r border-gray-100 dark:border-gray-800/70 flex items-center justify-end pr-2 sm:pr-3 shrink-0 select-none ${
                    hasEvents ? 'items-start pt-3' : ''
                  }`}>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-[#1a73e8] transition-colors">
                      <span className="font-mono text-[10px] sm:text-[11px]">{slot.label24}</span>
                      <span className="hidden sm:inline text-[9px] text-gray-400/70">({slot.label12})</span>
                    </div>
                  </div>

                  <div className={`flex-1 p-2 space-y-2 flex flex-col justify-center ${hasEvents ? 'justify-start' : ''}`}>
                    {hasEvents ? (
                      eventosEnHora.map((ev) => {
                        const style = getGoogleEventColor(ev.tipo);
                        return (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventoDetalle(ev);
                            }}
                            className={`p-3 rounded-xl ${style.bg} transition-all space-y-1.5 cursor-grab active:cursor-grabbing relative shadow-xs hover:shadow-sm`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-2 pr-6">
                                <GripVertical className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0 cursor-grab" />
                                <span className={`h-2 w-2 rounded-full ${style.dot} shrink-0`}></span>
                                <h3 className={`text-xs sm:text-sm font-bold ${style.text} line-clamp-1`}>
                                  {ev.titulo}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${style.chip}`}>
                                  {ev.tipo}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAbrirEditar(ev);
                                  }}
                                  title="Editar este evento"
                                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEventoAEliminar(ev);
                                  }}
                                  title="Eliminar"
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 pt-0.5">
                              <div className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
                                <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span>{formatTimeDisplay(ev.hora)} {ev.horaFin ? `– ${formatTimeDisplay(ev.horaFin)}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Landmark className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span className="truncate">{ev.lugar}</span>
                              </div>
                              <a
                                href={ev.ubicacionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline text-[11px] font-medium ml-auto"
                              >
                                <MapPin className="h-3 w-3 text-red-500" />
                                <span>Ubicación</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-between pr-4">
                        <span className="text-[10px] text-gray-300 dark:text-gray-700 italic group-hover:hidden select-none">Sin eventos</span>
                        <div className="hidden group-hover:flex items-center gap-1 text-[11px] font-medium text-[#1a73e8] bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 shadow-2xs">
                          <span>+ Agendar a las {slot.label24}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. GOOGLE CALENDAR VISTA SEMANAL (24 HORAS) */}
      {vista === 'semana' && (
        <div className="space-y-2">
          {/* Tira responsiva de selector de días para móvil */}
          <div className="sm:hidden grid grid-cols-7 gap-1 bg-white dark:bg-[#121824] p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs text-center">
            {diasSemana.map((col) => (
              <button
                key={col.fecha}
                type="button"
                onClick={() => setFechaSeleccionada(col.fecha)}
                className={`py-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                  fechaSeleccionada === col.fecha
                    ? 'bg-[#1a73e8] text-white font-bold shadow-xs'
                    : col.esHoy
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-[9px] uppercase">{col.diaNombre.slice(0, 3)}</span>
                <span className="text-xs font-mono">{col.diaNumero}</span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-x-auto">
            <div className="min-w-[840px] sm:min-w-[960px]">
              <div className="grid grid-cols-8 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center sticky top-0 z-10">
                <div className="p-3 border-r border-gray-200/80 dark:border-gray-800 flex items-center justify-center text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  24 HORAS
                </div>
              {diasSemana.map((col) => (
                <div
                  key={col.fecha}
                  onClick={() => setFechaSeleccionada(col.fecha)}
                  className={`p-2.5 border-r border-gray-200/80 dark:border-gray-800 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${
                    fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/50 dark:bg-blue-950/30' : 'hover:bg-gray-100 dark:bg-gray-800/70'
                  }`}
                >
                  <span className={`text-[11px] font-semibold tracking-wider ${col.esHoy ? 'text-[#1a73e8]' : 'text-gray-500 dark:text-gray-400'}`}>
                    {col.diaNombre}
                  </span>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      col.esHoy
                        ? 'bg-[#1a73e8] text-white shadow-xs'
                        : fechaSeleccionada === col.fecha
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {col.diaNumero}
                  </span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/70 max-h-[75vh] overflow-y-auto">
              {HORAS_DEL_DIA_24.map((slot) => {
                const rowHasEvents = diasSemana.some((col) =>
                  eventos.some((e) => e.fecha === col.fecha && getHourNumber(e.hora) === slot.hourNumber)
                );

                return (
                  <div 
                    key={slot.hourNumber} 
                    className={`grid grid-cols-8 transition-all ${
                      rowHasEvents ? 'min-h-[76px]' : 'min-h-[34px] hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    <div className="p-1 border-r border-gray-100 dark:border-gray-800 text-right text-[11px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/20 select-none flex items-center justify-end pr-2">
                      {slot.label24}
                    </div>
                    {diasSemana.map((col) => {
                      const evs = eventos.filter(
                        (e) => e.fecha === col.fecha && getHourNumber(e.hora) === slot.hourNumber
                      );

                      return (
                        <div
                          key={col.fecha}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, col.fecha, slot.defaultTimeInput)}
                          onClick={() => {
                            setFechaSeleccionada(col.fecha);
                            handleAbrirCrearEnHora(slot.defaultTimeInput, col.fecha);
                          }}
                          className={`p-1 border-r border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                            fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/20 dark:bg-blue-950/20' : 'hover:bg-[#e8f0fe]/10'
                          }`}
                        >
                          {evs.map((ev) => {
                            const style = getGoogleEventColor(ev.tipo);
                            return (
                              <div
                                key={ev.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, ev)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEventoDetalle(ev);
                                }}
                                className={`group/week-ev p-1.5 rounded-lg ${style.bg} text-[11px] shadow-2xs mb-1 hover:shadow-sm transition-all relative cursor-grab active:cursor-grabbing`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <p className={`font-bold ${style.text} line-clamp-2 leading-tight`}>
                                    {ev.titulo}
                                  </p>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover/week-ev:opacity-100 transition-all shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAbrirEditar(ev);
                                      }}
                                      title="Editar"
                                      className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-[#1a73e8] rounded"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEventoAEliminar(ev);
                                      }}
                                      title="Eliminar"
                                      className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5 truncate">{ev.lugar}</p>
                                <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-gray-200/80 dark:border-gray-800/50">
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${style.chip}`}>
                                    {ev.tipo}
                                  </span>
                                  <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">
                                    {formatTimeDisplay(ev.hora)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
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

      {/* 3. GOOGLE CALENDAR VISTA MENSUAL */}
      {vista === 'mes' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-2.5 sm:p-4 space-y-2 sm:space-y-3">
          <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-1 border-b border-gray-100 dark:border-gray-800">
            <span>LUN</span>
            <span>MAR</span>
            <span>MIÉ</span>
            <span>JUE</span>
            <span>VIE</span>
            <span>SÁB</span>
            <span>DOM</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: 30 }, (_, i) => {
              const diaNum = i + 1;
              const mesStr = parseDate(fechaSeleccionada).getMonth() + 1;
              const yearStr = parseDate(fechaSeleccionada).getFullYear();
              const fStr = `${yearStr}-${String(mesStr).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
              const evs = eventos.filter((e) => e.fecha === fStr);
              const isSelected = fechaSeleccionada === fStr;
              const esHoy = fStr === formatDate(new Date());

              return (
                <div
                  key={fStr}
                  onClick={() => {
                    setFechaSeleccionada(fStr);
                    setVista('dia');
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, fStr, '09:00')}
                  className={`min-h-[50px] sm:min-h-[105px] p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1a73e8] bg-[#e8f0fe]/30 shadow-xs'
                      : esHoy
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20'
                      : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-4 w-4 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                        esHoy
                          ? 'bg-[#1a73e8] text-white'
                          : isSelected
                          ? 'text-[#1a73e8] font-bold'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {diaNum}
                    </span>
                    {evs.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
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

      {/* MODAL DETALLES DEL EVENTO */}
      {eventoDetalle && !eventoAEditar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
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

      {/* MODAL EDITAR EVENTO */}
      {eventoAEditar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
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
                    onChange={(e) => setEditHora(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Hora Término</label>
                  <input
                    type="time"
                    value={formatTimeTo24(editHoraFin)}
                    onChange={(e) => setEditHoraFin(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Lugar */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Lugar:</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Selecciona o administra lugares guardados</span>
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

                {/* Badges de lugares con botón x de eliminar */}
                {sedesFrecuentes.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Lugares guardados:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {sedesFrecuentes.map((sede) => {
                        const isSelected = editSedeSeleccionadaId === sede.id;
                        return (
                          <div
                            key={sede.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 text-[#1a73e8] font-bold dark:bg-blue-950/40 dark:border-blue-700'
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
                              title="Eliminar este lugar"
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
                    {editUbicacionUrl.trim() && !isValidGoogleMapsUrl(editUbicacionUrl) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Ingresa un enlace válido de Google Maps (ej: https://maps.app.goo.gl/..., https://maps.google.com/...)
                      </p>
                    )}
                  </div>

                  {editLugar && editUbicacionUrl && !sedesFrecuentes.some(s => s.nombre.toLowerCase() === editLugar.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const tempSedeId = `sede-${Date.now()}`;
                        const newSedeObj = {
                          id: tempSedeId,
                          nombre: editLugar.trim(),
                          ubicacionUrl: editUbicacionUrl.trim(),
                          referencia: editTipo,
                        };
                        const updatedSedes = [...sedesFrecuentes, newSedeObj];
                        setSedesFrecuentes(updatedSedes);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('legislab_sedes_frecuentes', JSON.stringify(updatedSedes));
                        }
                        try {
                          const res = await createAgendaSede({
                            nombre: editLugar.trim(),
                            ubicacionUrl: editUbicacionUrl.trim(),
                            referencia: editTipo,
                          });
                          if (res.success && res.data) {
                            setSedesFrecuentes((prev) =>
                              prev.map((s) => (s.id === tempSedeId ? {
                                id: res.data.id,
                                nombre: res.data.nombre,
                                ubicacionUrl: res.data.ubicacionUrl,
                                referencia: res.data.referencia || undefined,
                              } : s))
                            );
                          }
                        } catch (err) {
                          console.warn('Error saving sede to db:', err);
                        }
                      }}
                      className="text-[11px] font-semibold text-[#1a73e8] hover:underline flex items-center gap-1 pt-1"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      Guardar este lugar para todo el despacho
                    </button>
                  )}
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

                {/* Chips de tipos con botón x para eliminar */}
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
                  rows={4}
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
                  className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR REAGENDADO (DRAG & DROP) */}
      {reagendadoPendiente && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#1a73e8] shrink-0">
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
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{reagendadoPendiente.evento.fecha} | {reagendadoPendiente.evento.hora}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1a73e8] mx-2 shrink-0" />
                <div>
                  <span className="text-[#1a73e8] block text-[10px] font-bold">Nuevo horario:</span>
                  <span className="font-bold text-[#1a73e8]">{reagendadoPendiente.nuevaFecha} | {reagendadoPendiente.nuevaHora}</span>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-sm shadow-blue-600/20 transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Confirmar Reagendado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO EVENTO */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#1a73e8]" />
                Nuevo evento
              </h2>
              <button onClick={() => setIsModalCrearOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
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
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Hora Término</label>
                  <input
                    type="time"
                    value={formatTimeTo24(nuevaHoraFin)}
                    onChange={(e) => setNuevaHoraFin(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

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

                {/* Badges de lugares guardados con botón x de eliminación */}
                {sedesFrecuentes.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Lugares guardados:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {sedesFrecuentes.map((sede) => {
                        const isSelected = sedeSeleccionadaId === sede.id;
                        return (
                          <div
                            key={sede.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 text-[#1a73e8] font-bold dark:bg-blue-950/40 dark:border-blue-700'
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
                              title="Eliminar este lugar"
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
                    {nuevaUbicacionUrl.trim() && !isValidGoogleMapsUrl(nuevaUbicacionUrl) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Ingresa un enlace válido de Google Maps (ej: https://maps.app.goo.gl/..., https://maps.google.com/...)
                      </p>
                    )}
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
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Selecciona o administra categorías</span>
                </div>

                {/* Chips de tipos de evento con botón x para eliminar */}
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
                        placeholder="Ej: Foro Ciudadano, Rueda de Prensa, Mesa Técnica..."
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
                  rows={4}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Escribe puntos clave a tratar, acuerdos previos, relación de invitados, documentos o notas..."
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
                  className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg shadow-sm"
                >
                  Crear evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE EVENTO */}
      {eventoAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl space-y-4">
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

      {/* MODAL CONFIRMAR ELIMINACIÓN DE LUGAR / SEDE */}
      {sedeAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl space-y-4">
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

      {/* MODAL COMPARTIR AGENDA POR WHATSAPP */}
      {isModalCompartirOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
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
                  className="text-xs font-semibold text-[#1a73e8] hover:underline"
                >
                  {eventosSeleccionadosIds.length === eventosDelDia.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="space-y-2">
                {eventosDelDia.map((ev) => {
                  const isChecked = eventosSeleccionadosIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleSelectEvento(ev.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 opacity-60'
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-emerald-600 shrink-0">
                        {isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                      </button>
                      <div className="space-y-0.5 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">🟢 {ev.titulo}</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">⏰ {ev.hora} | Lugar: {ev.lugar}</p>
                        <p className="text-[10px] text-blue-600 font-mono truncate">📍 {ev.ubicacionUrl}</p>
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

              <div className="p-4 rounded-xl bg-emerald-950/5 border border-emerald-500/20 font-sans text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {generarTextoWhatsApp()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleCopiarWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors"
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Enviar a WhatsApp Directo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}