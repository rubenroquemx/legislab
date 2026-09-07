'use client';

import { useState, useEffect } from 'react';
import { getAgendaEventos, createAgendaEvento, deleteAgendaEvento } from '@/app/actions/agenda';
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

const HORAS_DEL_DIA = [
  '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
  '07:00 PM', '08:00 PM', '09:00 PM'
];

const OPCIONES_HORARIOS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM'
];

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

function getWeekDays(currentDateStr: string) {
  const base = parseDate(currentDateStr);
  const dayOfWeek = base.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(base);
  monday.setDate(base.getDate() + distanceToMonday);

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
      esHoy: fStr === '2026-09-02',
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
        const res = await getAgendaEventos();
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
        }
      } catch (err) {
        console.warn('Error loading agenda:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  const [sedesFrecuentes, setSedesFrecuentes] = useState<SedeFrecuente[]>(SEDES_PREDETERMINADAS);
  const [tiposEventos, setTiposEventos] = useState<string[]>(TIPOS_BASE);
  const [vista, setVista] = useState<'mes' | 'semana' | 'dia'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-09-02');

  // Google Calendar live sync states
  const [isSyncingGCal, setIsSyncingGCal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('En vivo');

  // Modals & Active selections
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [isModalCompartirOpen, setIsModalCompartirOpen] = useState(false);
  const [eventoDetalle, setEventoDetalle] = useState<EventoLegislativo | null>(null);
  const [eventoAEditar, setEventoAEditar] = useState<EventoLegislativo | null>(null);
  const [eventoAEliminar, setEventoAEliminar] = useState<EventoLegislativo | null>(null);
  const [reagendadoPendiente, setReagendadoPendiente] = useState<{
    evento: EventoLegislativo;
    nuevaFecha: string;
    nuevaHora: string;
  } | null>(null);

  // Drag state
  const [draggedEventoId, setDraggedEventoId] = useState<string | null>(null);

  // Form states (Crear)
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('2026-09-02');
  const [nuevaHora, setNuevaHora] = useState('09:00 AM');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('10:30 AM');
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
  const [editHora, setEditHora] = useState('');
  const [editHoraFin, setEditHoraFin] = useState('');
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

  const handleAbrirCrearEnHora = (horaSlot: string, fechaTarget?: string) => {
    setNuevaFecha(fechaTarget || fechaSeleccionada);
    setNuevaHora(horaSlot);
    
    const idx = OPCIONES_HORARIOS.indexOf(horaSlot);
    if (idx !== -1 && idx + 2 < OPCIONES_HORARIOS.length) {
      setNuevaHoraFin(OPCIONES_HORARIOS[idx + 2]);
    } else {
      setNuevaHoraFin(horaSlot);
    }
    
    setIsCustomTipo(false);
    setCustomTipoInput('');
    setIsModalCrearOpen(true);
  };

  const handleAbrirEditar = (ev: EventoLegislativo) => {
    setEventoAEditar(ev);
    setEditTitulo(ev.titulo);
    setEditFecha(ev.fecha);
    setEditHora(ev.hora);
    setEditHoraFin(ev.horaFin || ev.hora);
    setEditLugar(ev.lugar);
    setEditUbicacionUrl(ev.ubicacionUrl);
    setEditTipo(ev.tipo);
    setEditIsCustomTipo(false);
    setEditCustomTipoInput('');
    setEditDescripcion(ev.descripcion || '');
    
    // Check if place matches a frequent venue
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

  const handleConfirmarReagendado = () => {
    if (!reagendadoPendiente) return;
    const { evento, nuevaFecha, nuevaHora } = reagendadoPendiente;

    let nuevaHoraFin = nuevaHora;
    const startIdx = OPCIONES_HORARIOS.indexOf(nuevaHora);
    if (startIdx !== -1 && startIdx + 2 < OPCIONES_HORARIOS.length) {
      nuevaHoraFin = OPCIONES_HORARIOS[startIdx + 2];
    }

    setEventos(
      eventos.map((ev) => {
        if (ev.id === evento.id) {
          return {
            ...ev,
            fecha: nuevaFecha,
            hora: nuevaHora,
            horaFin: nuevaHoraFin,
          };
        }
        return ev;
      })
    );

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
      texto += `⏰ ${ev.hora}${ev.horaFin ? ` - ${ev.horaFin}` : ''}\n`;
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

  const handleConfirmarEliminar = () => {
    if (!eventoAEliminar) return;
    setEventos(eventos.filter((e) => e.id !== eventoAEliminar.id));
    if (eventoDetalle && eventoDetalle.id === eventoAEliminar.id) {
      setEventoDetalle(null);
    }
    setEventoAEliminar(null);
    triggerGoogleCalendarSync();
  };

  const handleCrearEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoLugar.trim() || !nuevaUbicacionUrl.trim()) {
      alert('Por favor completa todos los campos obligatorios (Título, Lugar y Enlace de Ubicación).');
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
        setTiposEventos([...tiposEventos, tipoFinal]);
      }
    }

    if (guardarComoFrecuente && nuevoLugar.trim() && nuevaUbicacionUrl.trim()) {
      const yaExiste = sedesFrecuentes.some(
        (s) => s.nombre.toLowerCase() === nuevoLugar.trim().toLowerCase()
      );
      if (!yaExiste) {
        setSedesFrecuentes([
          ...sedesFrecuentes,
          {
            id: `sede-${Date.now()}`,
            nombre: nuevoLugar.trim(),
            ubicacionUrl: nuevaUbicacionUrl.trim(),
            referencia: tipoFinal,
          },
        ]);
      }
    }

    const nuevo: EventoLegislativo = {
      id: `ev-${Date.now()}`,
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

    setEventos([...eventos, nuevo]);
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
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoAEditar) return;
    if (!editTitulo.trim() || !editLugar.trim() || !editUbicacionUrl.trim()) {
      alert('Por favor completa todos los campos obligatorios.');
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
        setTiposEventos([...tiposEventos, tipoFinal]);
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

    setEventos(eventos.map((ev) => (ev.id === eventoAEditar.id ? updatedEvent : ev)));
    setEventoDetalle(updatedEvent);
    setEventoAEditar(null);
    triggerGoogleCalendarSync();
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
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setNuevaFecha(fechaSeleccionada);
              setNuevaHora('09:00 AM');
              setNuevaHoraFin('10:30 AM');
              setIsCustomTipo(false);
              setCustomTipoInput('');
              setIsModalCrearOpen(true);
            }}
            className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-semibold px-4 py-2 rounded-full border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm"
          >
            <div className="h-5 w-5 flex items-center justify-center font-bold text-lg text-[#1a73e8]">+</div>
            <span className="font-medium text-gray-800 dark:text-gray-100">Crear</span>
          </button>

          <button
            onClick={() => setFechaSeleccionada('2026-09-02')}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors shadow-2xs"
          >
            Hoy
          </button>

          <div className="flex items-center gap-1">
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

          <h2 className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 capitalize tracking-tight ml-1">
            {getTituloNavegacion()}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800/80 text-[11px] font-medium text-gray-600 dark:text-gray-300 shadow-2xs">
            <div className={`h-2 w-2 rounded-full ${isSyncingGCal ? 'bg-blue-500 animate-ping' : 'bg-[#0b8043]'}`}></div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Google Calendar:</span>
            <span className="text-gray-500 dark:text-gray-400">{isSyncingGCal ? 'Sincronizando...' : lastSyncTime}</span>
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800/90 p-1 rounded-xl text-xs font-semibold border border-gray-200/80 dark:border-gray-800/60">
            <button
              onClick={() => setVista('dia')}
              className={`px-3 py-1 rounded-lg transition-all ${
                vista === 'dia'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setVista('semana')}
              className={`px-3 py-1 rounded-lg transition-all ${
                vista === 'semana'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVista('mes')}
              className={`px-3 py-1 rounded-lg transition-all ${
                vista === 'mes'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              Mes
            </button>
          </div>

          <button
            onClick={handleOpenCompartir}
            disabled={!diaTieneEventos}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
              diaTieneEventos
                ? 'bg-[#0b8043] hover:bg-[#096e38] text-white shadow-sm cursor-pointer'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200/80 dark:border-gray-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartir agenda</span>
          </button>
        </div>
      </div>

      {/* 1. GOOGLE CALENDAR VISTA DIARIA */}
      {vista === 'dia' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium px-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 dark:text-gray-100 capitalize">
                {new Date(`${fechaSeleccionada}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span>• Haz clic en un evento para ver detalles o editarlo</span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{eventosDelDia.length} eventos agendados</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {HORAS_DEL_DIA.map((horaSlot) => {
              const horaPrefix = horaSlot.slice(0, 2);
              const ampm = horaSlot.slice(-2);
              
              const eventosEnHora = eventosDelDia.filter((ev) => {
                return ev.hora.startsWith(horaPrefix) && ev.hora.endsWith(ampm);
              });

              return (
                <div 
                  key={horaSlot} 
                  onClick={() => handleAbrirCrearEnHora(horaSlot, fechaSeleccionada)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, fechaSeleccionada, horaSlot)}
                  className="group flex min-h-[82px] hover:bg-[#e8f0fe]/30 transition-all cursor-pointer relative"
                >
                  <div className="w-24 p-3 border-r border-gray-100 dark:border-gray-800 flex items-start justify-end shrink-0 select-none">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-[#1a73e8] transition-colors">
                      {horaSlot}
                    </span>
                  </div>

                  <div className="flex-1 p-2 space-y-2">
                    {eventosEnHora.length > 0 ? (
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
                                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-[#1a73e8] hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEventoAEliminar(ev);
                                  }}
                                  title="Eliminar"
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 pt-0.5">
                              <div className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
                                <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span>{ev.hora} {ev.horaFin ? `– ${ev.horaFin}` : ''}</span>
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
                      <div className="h-full flex items-center justify-between pr-4 py-1">
                        <span className="text-[11px] text-slate-300 italic group-hover:hidden select-none">Disponible</span>
                        <div className="hidden group-hover:flex items-center gap-1 text-[11px] font-medium text-[#1a73e8] bg-white px-2.5 py-1 rounded-full border border-blue-200 shadow-2xs">
                          <span>+ Agendar compromiso a las {horaSlot}</span>
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

      {/* 2. GOOGLE CALENDAR VISTA SEMANAL */}
      {vista === 'semana' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-x-auto">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-8 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40/70 text-center">
              <div className="p-3 border-r border-gray-200/80 dark:border-gray-800 flex items-center justify-center text-[11px] font-medium text-gray-400 dark:text-gray-500">
                GMT-6
              </div>
              {diasSemana.map((col) => (
                <div
                  key={col.fecha}
                  onClick={() => setFechaSeleccionada(col.fecha)}
                  className={`p-2.5 border-r border-gray-200/80 dark:border-gray-800 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${
                    fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/50' : 'hover:bg-gray-100 dark:bg-gray-800/70'
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

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map((horaSlot) => {
                const prefix = horaSlot.slice(0, 2);
                const ampm = horaSlot.slice(-2);

                return (
                  <div key={horaSlot} className="grid grid-cols-8 min-h-[92px]">
                    <div className="p-2 border-r border-gray-100 dark:border-gray-800 text-right text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40/20 select-none">
                      {horaSlot}
                    </div>
                    {diasSemana.map((col) => {
                      const evs = eventos.filter((e) => e.fecha === col.fecha && e.hora.startsWith(prefix) && e.hora.endsWith(ampm));

                      return (
                        <div
                          key={col.fecha}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, col.fecha, horaSlot)}
                          onClick={() => {
                            setFechaSeleccionada(col.fecha);
                            handleAbrirCrearEnHora(horaSlot, col.fecha);
                          }}
                          className={`p-1 border-r border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                            fechaSeleccionada === col.fecha ? 'bg-[#e8f0fe]/20' : 'hover:bg-[#e8f0fe]/10'
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
                                    {ev.hora}
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
      )}

      {/* 3. GOOGLE CALENDAR VISTA MENSUAL */}
      {vista === 'mes' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-4 space-y-3">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-1 border-b border-gray-100 dark:border-gray-800">
            <span>LUN</span>
            <span>MAR</span>
            <span>MIÉ</span>
            <span>JUE</span>
            <span>VIE</span>
            <span>SÁB</span>
            <span>DOM</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => {
              const diaNum = i + 1;
              const mesStr = parseDate(fechaSeleccionada).getMonth() + 1;
              const yearStr = parseDate(fechaSeleccionada).getFullYear();
              const fStr = `${yearStr}-${String(mesStr).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
              const evs = eventos.filter((e) => e.fecha === fStr);
              const isSelected = fechaSeleccionada === fStr;
              const esHoy = fStr === '2026-09-02';

              return (
                <div
                  key={fStr}
                  onClick={() => {
                    setFechaSeleccionada(fStr);
                    setVista('dia');
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, fStr, '09:00 AM')}
                  className={`min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1a73e8] bg-[#e8f0fe]/30 shadow-xs'
                      : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {evs.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
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
                          <span className="truncate">{e.hora.slice(0, 5)} {e.titulo}</span>
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

      {/* MODAL DETALLES DEL EVENTO (Con Botón de Editar) */}
      {eventoDetalle && !eventoAEditar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${getGoogleEventColor(eventoDetalle.tipo).dot}`}></span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Detalles del Compromiso</h2>
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
                    <span>{eventoDetalle.fecha} | {eventoDetalle.hora} {eventoDetalle.horaFin ? `– ${eventoDetalle.horaFin}` : ''}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 dark:text-gray-500 font-medium block">Sede / Lugar:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                    <Landmark className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>{eventoDetalle.lugar}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Enlace de Ubicación:</span>
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
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Notas / Instrucciones Parlamentarias:</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#1a73e8]" />
                Editar Compromiso en Agenda
              </h2>
              <button onClick={() => setEventoAEditar(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Título / Asunto del Evento <span className="text-red-500">*</span>
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
                  <select
                    value={editHora}
                    onChange={(e) => setEditHora(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {OPCIONES_HORARIOS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Hora Término</label>
                  <select
                    value={editHoraFin}
                    onChange={(e) => setEditHoraFin(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {OPCIONES_HORARIOS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sedes Frecuentes / Autocompletado en Edición */}
              <div className="bg-gray-50 dark:bg-gray-800/40/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Sede / Ubicación:</span>
                  </label>
                </div>

                <select
                  value={editSedeSeleccionadaId}
                  onChange={(e) => handleSeleccionarSedeFrecuente(e.target.value, true)}
                  className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="personalizada">✏️ Ubicación Manual / Personalizada</option>
                  {sedesFrecuentes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      📍 {sede.nombre} ({sede.referencia || 'Sede'})
                    </option>
                  ))}
                </select>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Nombre del Lugar / Sede <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={editLugar}
                      onChange={(e) => setEditLugar(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Enlace de Ubicación (Google Maps / Share) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="url"
                      value={editUbicacionUrl}
                      onChange={(e) => setEditUbicacionUrl(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-[#1a73e8] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Evento */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Tipo de Evento
                </label>
                <select
                  value={editIsCustomTipo ? '__OTRO__' : editTipo}
                  onChange={(e) => {
                    if (e.target.value === '__OTRO__') {
                      setEditIsCustomTipo(true);
                      setEditCustomTipoInput('');
                    } else {
                      setEditIsCustomTipo(false);
                      setEditTipo(e.target.value);
                    }
                  }}
                  className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {tiposEventos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__OTRO__">✨ + Agregar nuevo tipo de evento...</option>
                </select>

                {editIsCustomTipo && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                    <label className="block text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#1a73e8]" />
                      <span>Nuevo tipo de evento:</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editCustomTipoInput}
                      onChange={(e) => setEditCustomTipoInput(e.target.value)}
                      placeholder="Ej: Audiencia Pública..."
                      className="w-full p-2 text-xs bg-white border border-blue-200 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Notas de Texto Largo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notas / Instrucciones Parlamentarias
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
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-6 shadow-xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#1a73e8]" />
                Registrar Compromiso en Agenda
              </h2>
              <button onClick={() => setIsModalCrearOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearEvento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Título / Asunto del Evento <span className="text-red-500">*</span>
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
                  <select
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {OPCIONES_HORARIOS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Hora Término</label>
                  <select
                    value={nuevaHoraFin}
                    onChange={(e) => setNuevaHoraFin(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {OPCIONES_HORARIOS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sedes Frecuentes / Autocompletado */}
              <div className="bg-gray-50 dark:bg-gray-800/40/80 p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />
                    <span>Sede / Ubicación Frecuente (Autocompletar):</span>
                  </label>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Elige una o escribe abajo</span>
                </div>

                <select
                  value={sedeSeleccionadaId}
                  onChange={(e) => handleSeleccionarSedeFrecuente(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Seleccionar sede guardada --</option>
                  {sedesFrecuentes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      📍 {sede.nombre} ({sede.referencia || 'Sede'})
                    </option>
                  ))}
                  <option value="personalizada">✏️ + Otra Ubicación / Personalizada</option>
                </select>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Nombre del Lugar / Sede <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={nuevoLugar}
                      onChange={(e) => setNuevoLugar(e.target.value)}
                      placeholder="Ej: Sala de Usos Múltiples en Congreso"
                      className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Enlace de Ubicación (Google Maps / Share) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="url"
                      value={nuevaUbicacionUrl}
                      onChange={(e) => setNuevaUbicacionUrl(e.target.value)}
                      placeholder="https://share.google/... o https://maps.app.goo.gl/..."
                      className="w-full p-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 text-[#1a73e8] font-mono"
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
                        Guardar esta sede en ubicaciones frecuentes para futuros eventos
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Tipo de Evento (Dinámico) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Tipo de Evento
                </label>
                <select
                  value={isCustomTipo ? '__OTRO__' : nuevoTipo}
                  onChange={(e) => {
                    if (e.target.value === '__OTRO__') {
                      setIsCustomTipo(true);
                      setCustomTipoInput('');
                    } else {
                      setIsCustomTipo(false);
                      setNuevoTipo(e.target.value);
                    }
                  }}
                  className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {tiposEventos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__OTRO__">✨ + Agregar nuevo tipo de evento...</option>
                </select>

                {isCustomTipo && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
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
                        className="flex-1 p-2 text-xs bg-white border border-blue-200 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTipo(false);
                          setNuevoTipo(tiposEventos[0] || 'Comisión');
                        }}
                        className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas de Texto Largo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notas / Instrucciones Ampliadas (Texto Largo)
                </label>
                <textarea
                  rows={4}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Escribe puntos clave a tratar, acuerdos previos, relación de invitados, documentos o expedientes requeridos para la sesión..."
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
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {eventoAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-md w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar este compromiso?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  ¿Realmente desea eliminar este evento? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 text-xs space-y-1">
              <p className="font-bold text-gray-900 dark:text-white line-clamp-2">🟢 {eventoAEliminar.titulo}</p>
              <p className="text-gray-600 dark:text-gray-300">⏰ {eventoAEliminar.hora} | Sede: {eventoAEliminar.lugar}</p>
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

      {/* MODAL COMPARTIR AGENDA POR WHATSAPP */}
      {isModalCompartirOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-2xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
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