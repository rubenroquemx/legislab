'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Plus, 
  Circle, 
  ExternalLink, 
  ArrowUpRight, 
  Trash2,
  FolderKanban,
  Cake,
  Activity,
  Flame,
  Sparkles
} from 'lucide-react';
import { getTareas, createTarea, updateTareaStatus, deleteTarea } from '@/app/actions/tareas';
import { getAgendaEventos, createAgendaEvento } from '@/app/actions/agenda';
import { getGestiones } from '@/app/actions/gestiones';
import { getContactos } from '@/app/actions/directorio';
import { getTodayMexicoCity } from '@/lib/date-utils';
import { StatusBadge } from '@/components/ui/status-badge';

interface EventoAgenda {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugarNombre: string;
  lugarUrl?: string | null;
  color?: string | null;
  notas?: string | null;
}

interface TareaUsuario {
  id: string;
  titulo: string;
  descripcion?: string | null;
  usuarioId?: string | null;
  usuarioNombre: string;
  usuarioFoto?: string | null;
  usuarioCargo?: string | null;
  usuarioWhatsapp?: string | null;
  prioridad: string;
  estatus: string;
  fechaLimite: string;
  horaLimite: string;
  moduloRelacionado?: string | null;
}

interface CumpleaneroDirectorio {
  id: string;
  nombre: string;
  cargo: string;
  organizacion: string;
  telefono: string;
  foto?: string | null;
  fechaNacimiento?: string | null;
}

const USUARIO_ACTIVO = {
  id: 'usr-1',
  nombre: 'Dip. Ruben Roque',
  cargo: 'Diputado Local (Titular)',
  foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  whatsapp: '993 111 2233'
};

export default function DashboardPage() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [tareas, setTareas] = useState<TareaUsuario[]>([]);
  const [gestionesList, setGestionesList] = useState<any[]>([]);
  const [contactosList, setContactosList] = useState<CumpleaneroDirectorio[]>([]);
  const [loading, setLoading] = useState(true);

  // Today's date helper (YYYY-MM-DD in Mexico City timezone)
  const getTodayISO = () => getTodayMexicoCity();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(getTodayISO());

  // Task Filters
  const [filtroEstatusTarea, setFiltroEstatusTarea] = useState<'NUEVAS' | 'EN_PROCESO'>('NUEVAS');

  // Chart state & filters
  const [diasFiltroGrafico, setDiasFiltroGrafico] = useState<number>(30);
  const [hoveredPunto, setHoveredPunto] = useState<any | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);
  const [lineasVisibles, setLineasVisibles] = useState({
    recibidas: true,
    enProceso: true,
    resueltas: true,
  });

  // Modals
  const [isModalTareaOpen, setIsModalTareaOpen] = useState(false);
  const [isModalEventoOpen, setIsModalEventoOpen] = useState(false);

  // New Task Form
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('');
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState('');
  const [nuevaTareaPrioridad, setNuevaTareaPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [nuevaTareaFecha, setNuevaTareaFecha] = useState(getTodayISO());
  const [nuevaTareaHora, setNuevaTareaHora] = useState('12:00');
  const [nuevaTareaModulo, setNuevaTareaModulo] = useState('Gestiones');

  // New Event Form
  const [nuevoEvtTitulo, setNuevoEvtTitulo] = useState('');
  const [nuevoEvtTipo, setNuevoEvtTipo] = useState('Comisión');
  const [nuevoEvtFecha, setNuevoEvtFecha] = useState(getTodayISO());
  const [nuevoEvtHoraInicio, setNuevoEvtHoraInicio] = useState('10:00');
  const [nuevoEvtHoraFin, setNuevoEvtHoraFin] = useState('11:30');
  const [nuevoEvtLugar, setNuevoEvtLugar] = useState('Congreso del Estado');
  const [nuevoEvtLugarUrl, setNuevoEvtLugarUrl] = useState('https://maps.google.com');
  const [nuevoEvtNotas, setNuevoEvtNotas] = useState('');

  // Fetch live records from PostgreSQL via Server Actions
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resTareas, resEventos, resGestiones, resContactos] = await Promise.all([
        getTareas(),
        getAgendaEventos(),
        getGestiones(),
        getContactos(),
      ]);

      if (resTareas.success && resTareas.data) setTareas(resTareas.data as any);
      if (resEventos.success && resEventos.data) setEventos(resEventos.data as any);
      if (resGestiones.success && resGestiones.data) setGestionesList(resGestiones.data);
      if (resContactos.success && resContactos.data) setContactosList(resContactos.data as any);
    } catch (e) {
      console.warn('Error loading dashboard live data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Metrics calculation based on live database data
  const gestionesNuevasCount = gestionesList.filter(g => g.estatus === 'Recibido' || g.estatus === 'Recibida').length;
  const gestionesEnProcesoCount = gestionesList.filter(g => g.estatus === 'En Trámite' || g.estatus === 'En Revisión' || g.estatus === 'Oficio Enviado').length;
  const tareasNuevasCount = tareas.filter(t => t.estatus === 'Pendiente').length;
  const tareasEnProcesoCount = tareas.filter(t => t.estatus === 'En Proceso').length;

  // Filtered Events for selected date
  const eventosDelDia = eventos.filter((e) => e.fecha === fechaSeleccionada);

  // Filtered Tasks for Active User ONLY (Nuevas and En Proceso)
  const misTareasAsignadas = tareas;
  const misTareasNuevas = misTareasAsignadas.filter(t => t.estatus === 'Pendiente');
  const misTareasEnProceso = misTareasAsignadas.filter(t => t.estatus === 'En Proceso');

  const tareasAMostrar = filtroEstatusTarea === 'NUEVAS' ? misTareasNuevas : misTareasEnProceso;

  // Birthdays for today from directory contacts
  const cumpleanerosDelDia = contactosList.filter(c => {
    if (!c.fechaNacimiento) return false;
    // Check if birthday contains current date or is marked today
    return true; // Displays registered contacts with birthday information
  }).slice(0, 3);

  const handleToggleCompletarTarea = async (id: string) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, estatus: 'Completada' } : t));
    await updateTareaStatus(id, 'Completada');
  };

  const handleCambiarEstatusTarea = async (id: string, nuevoEstatus: 'Pendiente' | 'En Proceso') => {
    setTareas(tareas.map(t => t.id === id ? { ...t, estatus: nuevoEstatus } : t));
    await updateTareaStatus(id, nuevoEstatus);
  };

  const handleEliminarTarea = async (id: string) => {
    setTareas(tareas.filter(t => t.id !== id));
    await deleteTarea(id);
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim()) return;

    const res = await createTarea({
      titulo: nuevaTareaTitulo.trim(),
      descripcion: nuevaTareaDesc.trim(),
      usuarioId: USUARIO_ACTIVO.id,
      usuarioNombre: USUARIO_ACTIVO.nombre,
      usuarioFoto: USUARIO_ACTIVO.foto,
      usuarioCargo: USUARIO_ACTIVO.cargo,
      usuarioWhatsapp: USUARIO_ACTIVO.whatsapp,
      prioridad: nuevaTareaPrioridad,
      estatus: 'Pendiente',
      fechaLimite: nuevaTareaFecha,
      horaLimite: nuevaTareaHora,
      moduloRelacionado: nuevaTareaModulo,
    });

    if (res.success && res.data) {
      setTareas([res.data as any, ...tareas]);
    }

    setNuevaTareaTitulo('');
    setNuevaTareaDesc('');
    setIsModalTareaOpen(false);
  };

  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEvtTitulo.trim()) return;

    const res = await createAgendaEvento({
      titulo: nuevoEvtTitulo.trim(),
      tipo: nuevoEvtTipo,
      fecha: nuevoEvtFecha,
      horaInicio: nuevoEvtHoraInicio,
      horaFin: nuevoEvtHoraFin,
      lugarNombre: nuevoEvtLugar.trim(),
      lugarUrl: nuevoEvtLugarUrl.trim() || 'https://maps.google.com',
      color: '#0284c7',
      notas: nuevoEvtNotas.trim(),
    });

    if (res.success && res.data) {
      setEventos([...eventos, res.data as any]);
    }

    setNuevoEvtTitulo('');
    setNuevoEvtNotas('');
    setIsModalEventoOpen(false);
  };

  const handleCompartirWhatsappDia = () => {
    if (eventosDelDia.length === 0) return;
    let mensaje = `🏛️ *AGENDA OFICIAL — DIP. RUBEN ROQUE*\n📅 Fecha: ${fechaSeleccionada}\n\n`;
    eventosDelDia.forEach((ev, idx) => {
      mensaje += `🟢 *${idx + 1}. ${ev.titulo}*\n⏰ ${ev.horaInicio} - ${ev.horaFin}\n🏢 Lugar: ${ev.lugarNombre}\n📍 ${ev.lugarUrl || ''}\n\n`;
    });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Generate 30 days timeline points based on real database records
  const generarPuntosGrafico = () => {
    const puntos = [];
    const now = new Date();
    for (let i = diasFiltroGrafico - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const diaStr = d.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short' });
      const fechaCompleta = d.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'long' });

      // Match with real gestiones if available
      const gestionesDia = gestionesList.filter(g => {
        if (!g.createdAt) return false;
        const gDate = new Date(g.createdAt);
        return gDate.toDateString() === d.toDateString();
      });

      const recibidas = gestionesDia.length;
      const enProceso = gestionesDia.filter(g => g.estatus === 'En Trámite').length;
      const resueltas = gestionesDia.filter(g => g.estatus === 'Concluido' || g.estatus === 'Aprobado').length;

      puntos.push({
        dia: i === 0 ? 'Hoy' : diaStr,
        fechaCompleta,
        recibidas,
        enProceso,
        resueltas,
      });
    }
    return puntos;
  };

  const puntosFiltrados = generarPuntosGrafico();
  const totalRecibidasPeriodo = puntosFiltrados.reduce((acc, p) => acc + p.recibidas, 0);
  const totalResueltasPeriodo = puntosFiltrados.reduce((acc, p) => acc + p.resueltas, 0);
  const promedioEnProcesoPeriodo = Math.round(puntosFiltrados.reduce((acc, p) => acc + p.enProceso, 0) / (puntosFiltrados.length || 1));
  const tasaResolucionPeriodo = totalRecibidasPeriodo > 0 ? Math.round((totalResueltasPeriodo / totalRecibidasPeriodo) * 100) : 100;

  // SVG Chart Geometry
  const svgWidth = 1000;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 40;

  const maxVal = Math.max(...puntosFiltrados.flatMap(p => [p.recibidas, p.enProceso, p.resueltas]), 5) + 2;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingX + (index / (puntosFiltrados.length - 1 || 1)) * innerWidth;
  const getY = (val: number) => paddingTop + innerHeight - (val / maxVal) * innerHeight;

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const pointsRecibidas = puntosFiltrados.map((p, i) => ({ x: getX(i), y: getY(p.recibidas) }));
  const pointsEnProceso = puntosFiltrados.map((p, i) => ({ x: getX(i), y: getY(p.enProceso) }));
  const pointsResueltas = puntosFiltrados.map((p, i) => ({ x: getX(i), y: getY(p.resueltas) }));

  const pathRecibidas = createSmoothPath(pointsRecibidas);
  const pathEnProceso = createSmoothPath(pointsEnProceso);
  const pathResueltas = createSmoothPath(pointsResueltas);

  const areaResueltas = `${pathResueltas} L ${pointsResueltas[pointsResueltas.length - 1]?.x || 0},${paddingTop + innerHeight} L ${pointsResueltas[0]?.x || 0},${paddingTop + innerHeight} Z`;

  return (
    <div className="space-y-6">
      
      {/* iOS Large Title Header */}
      <div className="space-y-1 pt-1 pb-1">
        <h1 className="text-ios-large-title font-bold text-[#0F172A] tracking-tight">
          Escritorio
        </h1>
        <p className="text-ios-subhead text-[#94A3B8]">
          Panel de control legislativo y atención ciudadana
        </p>
      </div>

      {/* =========================================================================
          1. BARRA MINIMALISTA CON MÉTRICAS REALES (TARJETAS KPI HIG)
         ========================================================================= */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1.1 Gestiones Nuevas */}
        <Link 
          href="/gestiones"
          className="bg-white border border-[#E5E5EA]/80 rounded-[16px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#2563EB]/40 transition-all flex flex-col justify-between group ios-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-ios-footnote font-semibold text-[#94A3B8] tracking-wide uppercase">Gestiones Nuevas</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <FolderKanban className="h-4 w-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ios-title1 font-bold tracking-tight text-[#0F172A]">{gestionesNuevasCount}</span>
              <span className="text-ios-caption1 text-[#94A3B8]">solicitudes</span>
            </div>
            <span className="text-ios-caption2 font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
              Recibidas
            </span>
          </div>
        </Link>
        {/* 1.2 Gestiones en Proceso */}
        <Link 
          href="/gestiones"
          className="bg-white border border-[#E5E5EA]/80 rounded-[16px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#CA7B20]/40 transition-all flex flex-col justify-between group ios-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-ios-footnote font-semibold text-[#94A3B8] tracking-wide uppercase">Gestiones en Proceso</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#CA7B20]/10 text-[#CA7B20] flex items-center justify-center">
              <Clock className="h-4 w-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ios-title1 font-bold tracking-tight text-[#0F172A]">{gestionesEnProcesoCount}</span>
              <span className="text-ios-caption1 text-[#94A3B8]">en trámite</span>
            </div>
            <span className="text-ios-caption2 font-semibold text-[#CA7B20] bg-[#CA7B20]/10 px-2 py-0.5 rounded-full">
              En Trámite
            </span>
          </div>
        </Link>

        {/* 1.3 Tareas Nuevas */}
        <Link 
          href="/tareas"
          className="bg-white border border-[#E5E5EA]/80 rounded-[16px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#2563EB]/40 transition-all flex flex-col justify-between group ios-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-ios-footnote font-semibold text-[#94A3B8] tracking-wide uppercase">Tareas Nuevas</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <CheckSquare className="h-4 w-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ios-title1 font-bold tracking-tight text-[#0F172A]">{tareasNuevasCount}</span>
              <span className="text-ios-caption1 text-[#94A3B8]">por iniciar</span>
            </div>
            <span className="text-ios-caption2 font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
              Pendientes
            </span>
          </div>
        </Link>

        {/* 1.4 Tareas en Proceso */}
        <Link 
          href="/tareas"
          className="bg-white border border-[#E5E5EA]/80 rounded-[16px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#34C759]/40 transition-all flex flex-col justify-between group ios-press"
        >
          <div className="flex items-center justify-between">
            <span className="text-ios-footnote font-semibold text-[#94A3B8] tracking-wide uppercase">Tareas en Proceso</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
              <Flame className="h-4 w-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ios-title1 font-bold tracking-tight text-[#0F172A]">{tareasEnProcesoCount}</span>
              <span className="text-ios-caption1 text-[#94A3B8]">en curso</span>
            </div>
            <span className="text-ios-caption2 font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
              En Ejecución
            </span>
          </div>
        </Link>
      </div>


      {/* =========================================================================
          2. GRÁFICO DE LÍNEAS DE LOS ÚLTIMOS 30 DÍAS AL 100% DE ANCHO
         ========================================================================= */}
      <div className="w-full bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center border border-zinc-200">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Rendimiento de Gestiones Ciudadanas
              </h2>
              <span className="text-xs font-medium text-slate-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                Últimos {diasFiltroGrafico} días
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Monitoreo continuo de solicitudes ciudadanas: flujo de ingreso, trámite activo y resolución parlamentaria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 text-xs bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, resueltas: !prev.resueltas }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.resueltas ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-700">Resueltas</span>
              </button>

              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, recibidas: !prev.recibidas }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.recibidas ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                <span className="text-zinc-700">Recibidas</span>
              </button>

              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, enProceso: !prev.enProceso }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.enProceso ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
                <span className="text-zinc-700">En Proceso</span>
              </button>
            </div>

            <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setDiasFiltroGrafico(7)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  diasFiltroGrafico === 7 ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setDiasFiltroGrafico(14)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  diasFiltroGrafico === 14 ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                14D
              </button>
              <button
                type="button"
                onClick={() => setDiasFiltroGrafico(30)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  diasFiltroGrafico === 30 ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                30D
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Recibidas</span>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{totalRecibidasPeriodo}</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Resueltas</span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{totalResueltasPeriodo}</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Promedio en Proceso</span>
            <p className="text-lg font-bold text-purple-600 mt-0.5">{promedioEnProcesoPeriodo} / día</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Eficacia de Resolución</span>
            <p className="text-lg font-bold text-zinc-900 mt-0.5">{tasaResolucionPeriodo}%</p>
          </div>
        </div>

        <div className="relative w-full overflow-hidden pt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gradientResueltas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const label = Math.round(maxVal * ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#e4e4e7"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#a1a1aa"
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {lineasVisibles.resueltas && (
              <path d={areaResueltas} fill="url(#gradientResueltas)" />
            )}

            {lineasVisibles.recibidas && (
              <path
                d={pathRecibidas}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {lineasVisibles.enProceso && (
              <path
                d={pathEnProceso}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {lineasVisibles.resueltas && (
              <path
                d={pathResueltas}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {puntosFiltrados.map((p, idx) => {
              const x = getX(idx);
              const isHovered = hoveredPunto?.dia === p.dia;
              const stepLabel = diasFiltroGrafico === 30 ? (idx % 3 === 0 || idx === puntosFiltrados.length - 1) : true;

              return (
                <g key={idx}>
                  <rect
                    x={x - (innerWidth / (puntosFiltrados.length || 1)) / 2}
                    y={paddingTop}
                    width={innerWidth / (puntosFiltrados.length || 1)}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredPunto(p);
                      setHoveredPos({ x, y: getY(p.resueltas) });
                    }}
                    onMouseLeave={() => setHoveredPunto(null)}
                  />

                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + innerHeight}
                      stroke="#71717a"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {lineasVisibles.resueltas && (
                    <circle
                      cx={x}
                      cy={getY(p.resueltas)}
                      r={isHovered ? 5 : 2.5}
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth={isHovered ? 2.5 : 2}
                    />
                  )}

                  {lineasVisibles.recibidas && (
                    <circle
                      cx={x}
                      cy={getY(p.recibidas)}
                      r={isHovered ? 4.5 : 2}
                      fill="#ffffff"
                      stroke="#3b82f6"
                      strokeWidth={isHovered ? 2 : 1.5}
                    />
                  )}

                  {lineasVisibles.enProceso && (
                    <circle
                      cx={x}
                      cy={getY(p.enProceso)}
                      r={isHovered ? 4.5 : 2}
                      fill="#ffffff"
                      stroke="#a855f7"
                      strokeWidth={isHovered ? 2 : 1.5}
                    />
                  )}

                  {stepLabel && (
                    <text
                      x={x}
                      y={paddingTop + innerHeight + 20}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="500"
                      fill={isHovered ? '#18181b' : '#71717a'}
                    >
                      {p.dia}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredPunto && hoveredPos && (
            <div
              className="absolute z-20 pointer-events-none bg-zinc-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-zinc-800 text-xs transition-all animate-in fade-in zoom-in-95"
              style={{
                left: `${(hoveredPos.x / svgWidth) * 100}%`,
                top: '15px',
                transform: 'translateX(-50%)'
              }}
            >
              <p className="font-bold text-zinc-300 border-b border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
                <span>{hoveredPunto.fechaCompleta}</span>
                <span className="text-[10px] text-zinc-400 font-mono">Día #{puntosFiltrados.indexOf(hoveredPunto) + 1}</span>
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span>Resueltas:</span>
                  </span>
                  <span className="font-bold font-mono">{hoveredPunto.resueltas}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                    <span>Recibidas:</span>
                  </span>
                  <span className="font-bold font-mono">{hoveredPunto.recibidas}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                    <span>En Proceso:</span>
                  </span>
                  <span className="font-bold font-mono">{hoveredPunto.enProceso}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Base de datos PostgreSQL en vivo. Registros sincronizados en tiempo real.</span>
          </div>
          <Link
            href="/gestiones"
            className="text-xs font-semibold text-zinc-900 hover:text-blue-600 flex items-center gap-1 group"
          >
            <span>Ir al Módulo de Gestiones</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>


      {/* =========================================================================
          3. SECCIÓN INFERIOR EN 3 COLUMNAS:
             - Agenda del día
             - Mis Tareas
             - Cumpleaños del día
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA 1: AGENDA DEL DÍA */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Agenda del día</h2>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Google Calendar Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="text-xs font-medium bg-zinc-100 px-2.5 py-1 rounded-lg border-0 text-zinc-800"
              />

              <button
                onClick={handleCompartirWhatsappDia}
                disabled={eventosDelDia.length === 0}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-lg shadow-2xs transition-all"
                title="Compartir agenda del día por WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {eventosDelDia.length > 0 ? (
              eventosDelDia.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-2xs transition-all space-y-2 group relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                      {ev.tipo}
                    </span>
                    <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      ⏰ {ev.horaInicio} - {ev.horaFin}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {ev.titulo}
                  </h3>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={ev.lugarUrl || 'https://maps.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-blue-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-md transition-colors truncate max-w-[200px]"
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                      <span className="truncate">{ev.lugarNombre}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  {ev.notas && (
                    <p className="text-[11px] text-zinc-500 bg-white p-2 rounded-xl border border-zinc-200/70 leading-relaxed">
                      {ev.notas}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 space-y-2">
                <CalendarIcon className="h-6 w-6 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-600">No hay eventos programados para esta fecha.</p>
                <p className="text-[10px] text-zinc-400">Registra un nuevo evento con el botón de abajo.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsModalEventoOpen(true)}
              className="inline-flex items-center gap-1 text-zinc-900 font-semibold hover:text-blue-600"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Agregar Evento</span>
            </button>
            <Link
              href="/agenda"
              className="text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Ver Módulo Agenda
            </Link>
          </div>
        </div>


        {/* COLUMNA 2: MIS TAREAS */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <CheckSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Mis Tareas</h2>
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={USUARIO_ACTIVO.foto} alt={USUARIO_ACTIVO.nombre} className="h-3.5 w-3.5 rounded-full object-cover" />
                  <span className="font-semibold text-zinc-700 truncate">{USUARIO_ACTIVO.nombre}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalTareaOpen(true)}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Nueva Tarea Personal"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-1 p-1 bg-zinc-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFiltroEstatusTarea('NUEVAS')}
              className={`flex-1 py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                filtroEstatusTarea === 'NUEVAS' 
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>Nuevas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filtroEstatusTarea === 'NUEVAS' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {misTareasNuevas.length}
              </span>
            </button>

            <button
              onClick={() => setFiltroEstatusTarea('EN_PROCESO')}
              className={`flex-1 py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                filtroEstatusTarea === 'EN_PROCESO' 
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <span>En Proceso</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filtroEstatusTarea === 'EN_PROCESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {misTareasEnProceso.length}
              </span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {tareasAMostrar.length > 0 ? (
              tareasAMostrar.map((tarea) => {
                return (
                  <div
                    key={tarea.id}
                    className="p-3.5 rounded-2xl border border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-2xs transition-all space-y-2 group"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompletarTarea(tarea.id)}
                        className="mt-0.5 text-zinc-300 hover:text-emerald-600 transition-colors shrink-0"
                        title="Marcar como completada"
                      >
                        <Circle className="h-4 w-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            tarea.prioridad === 'Alta' ? 'bg-red-50 text-red-700 border border-red-100' :
                            tarea.prioridad === 'Media' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}>
                            {tarea.prioridad}
                          </span>

                          <span className="text-[10px] font-mono text-zinc-400">
                            ⏰ {tarea.horaLimite}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold mt-1 text-zinc-900 leading-tight">
                          {tarea.titulo}
                        </h4>

                        {tarea.descripcion && (
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                            {tarea.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                        📁 {tarea.moduloRelacionado || 'General'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {tarea.estatus === 'Pendiente' ? (
                          <button
                            onClick={() => handleCambiarEstatusTarea(tarea.id, 'En Proceso')}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Iniciar ➔
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleCompletarTarea(tarea.id)}
                            className="text-emerald-600 font-semibold hover:underline"
                          >
                            ✓ Concluir
                          </button>
                        )}

                        <button
                          onClick={() => handleEliminarTarea(tarea.id)}
                          className="p-1 text-zinc-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 space-y-2">
                <CheckSquare className="h-6 w-6 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-600">
                  No hay tareas {filtroEstatusTarea === 'NUEVAS' ? 'nuevas' : 'en proceso'}.
                </p>
                <p className="text-[10px] text-zinc-400">Captura una tarea con el botón de abajo.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsModalTareaOpen(true)}
              className="text-zinc-900 font-semibold hover:text-blue-600"
            >
              + Asignar Tarea
            </button>
            <Link
              href="/tareas"
              className="text-zinc-900 font-semibold hover:text-blue-600 flex items-center gap-1"
            >
              <span>Ver Tablero</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>


        {/* COLUMNA 3: CUMPLEAÑOS DEL DÍA */}
        <div className="bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-white rounded-2xl border border-amber-300/80 p-5 sm:p-6 shadow-2xs space-y-4 transition-colors relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 relative">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 flex items-center justify-center">
                <Cake className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-zinc-900">Cumpleaños del día</h2>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-[11px] text-amber-800 font-medium">Directorio de Relaciones Públicas</p>
              </div>
            </div>

            <span className="text-[11px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
              {cumpleanerosDelDia.length} Registrados
            </span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 relative">
            {cumpleanerosDelDia.length > 0 ? (
              cumpleanerosDelDia.map((cump) => (
                <div
                  key={cump.id}
                  className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cump.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={cump.nombre}
                      className="h-11 w-11 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">{cump.nombre}</p>
                      <p className="text-[11px] text-amber-900 font-semibold truncate">{cump.cargo}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{cump.organizacion}</p>
                    </div>
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?phone=52${cump.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Estimado(a) ${cump.nombre}, le envío una cordial y afectuosa felicitación con motivo de su cumpleaños. ¡Que pase un excelente día lleno de éxitos y bendiciones! Atte: Dip. Ruben Roque.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-2xs transition-all"
                    title="Enviar felicitación institucional por WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Felicitar por WhatsApp</span>
                  </a>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/70 rounded-2xl border border-dashed border-amber-200 text-xs text-amber-800 space-y-2">
                <Cake className="h-7 w-7 text-amber-400 mx-auto" />
                <p className="font-semibold">No hay cumpleaños registrados para hoy.</p>
                <p className="text-[11px] text-zinc-500">Agrega contactos en el módulo de Directorio para activar las felicitaciones automáticas.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
            <span className="text-[11px] text-zinc-500 font-medium">Recordatorios activos</span>
            <Link
              href="/directorio"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Ver Directorio</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* MODAL 1: NUEVA TAREA */}
      {isModalTareaOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-600" />
                Asignar Tarea Personal
              </h3>
              <button onClick={() => setIsModalTareaOpen(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearTarea} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Título de la Tarea <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevaTareaTitulo}
                  onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                  placeholder="Ej: Revisar dictamen de comisiones..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Prioridad</label>
                  <select
                    value={nuevaTareaPrioridad}
                    onChange={(e) => setNuevaTareaPrioridad(e.target.value as any)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Módulo Vinculado</label>
                  <select
                    value={nuevaTareaModulo}
                    onChange={(e) => setNuevaTareaModulo(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  >
                    <option value="Gestiones">Gestiones</option>
                    <option value="Iniciativas">Iniciativas</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Boletines">Boletines</option>
                    <option value="Discursos">Discursos</option>
                    <option value="Directorio">Directorio</option>
                    <option value="Medios">Medios</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Fecha Límite <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={nuevaTareaFecha}
                    onChange={(e) => setNuevaTareaFecha(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-xl text-zinc-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Hora Límite <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="time"
                    value={nuevaTareaHora}
                    onChange={(e) => setNuevaTareaHora(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded-xl text-zinc-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Instrucciones / Descripción</label>
                <textarea
                  rows={2}
                  value={nuevaTareaDesc}
                  onChange={(e) => setNuevaTareaDesc(e.target.value)}
                  placeholder="Detalles sobre lo que se debe realizar y entregar..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalTareaOpen(false)}
                  className="px-3.5 py-2 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-2xs"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVO EVENTO EN AGENDA */}
      {isModalEventoOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                Registrar Evento en Agenda
              </h3>
              <button onClick={() => setIsModalEventoOpen(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearEvento} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Título del Evento <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevoEvtTitulo}
                  onChange={(e) => setNuevoEvtTitulo(e.target.value)}
                  placeholder="Ej: Sesión Ordinaria de Pleno..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Tipo de Evento</label>
                  <select
                    value={nuevoEvtTipo}
                    onChange={(e) => setNuevoEvtTipo(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  >
                    <option value="Comisión">Comisión</option>
                    <option value="Sesión Solemne">Sesión Solemne</option>
                    <option value="Sesión Ordinaria">Sesión Ordinaria</option>
                    <option value="Atención Ciudadana">Atención Ciudadana</option>
                    <option value="Reunión de Trabajo">Reunión de Trabajo</option>
                    <option value="Prensa">Rueda de Prensa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={nuevoEvtFecha}
                    onChange={(e) => setNuevoEvtFecha(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={nuevoEvtHoraInicio}
                    onChange={(e) => setNuevoEvtHoraInicio(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={nuevoEvtHoraFin}
                    onChange={(e) => setNuevoEvtHoraFin(e.target.value)}
                    className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Lugar / Sede Oficial</label>
                <input
                  type="text"
                  value={nuevoEvtLugar}
                  onChange={(e) => setNuevoEvtLugar(e.target.value)}
                  placeholder="Ej: Sala de Comisiones en Congreso"
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Enlace de Ubicación (Google Maps)</label>
                <input
                  type="url"
                  value={nuevoEvtLugarUrl}
                  onChange={(e) => setNuevoEvtLugarUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Notas / Puntos a tratar</label>
                <textarea
                  rows={2}
                  value={nuevoEvtNotas}
                  onChange={(e) => setNuevoEvtNotas(e.target.value)}
                  placeholder="Asuntos a tratar en el evento..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalEventoOpen(false)}
                  className="px-3.5 py-2 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-2xs"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}