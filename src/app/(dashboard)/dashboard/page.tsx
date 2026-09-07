'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface EventoAgenda {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugarNombre: string;
  lugarUrl: string;
  color: string;
  notas: string;
}

interface TareaUsuario {
  id: string;
  titulo: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioFoto: string;
  usuarioCargo: string;
  usuarioWhatsapp: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estatus: 'Pendiente' | 'En Proceso' | 'Completada';
  fechaLimite: string;
  horaLimite: string;
  moduloRelacionado: string;
}

interface CumpleaneroDirectorio {
  id: string;
  nombre: string;
  cargo: string;
  organizacion: string;
  telefono: string;
  foto: string;
  fechaNacimiento: string;
}

const USUARIO_ACTIVO = {
  id: 'usr-1',
  nombre: 'Dip. Ruben Roque',
  cargo: 'Diputado Local (Titular)',
  foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  whatsapp: '993 111 2233'
};

const INITIAL_EVENTOS: EventoAgenda[] = [
  {
    id: 'evt-1',
    titulo: '61. COMISIÓN ORDINARIA DE GOBERNACIÓN Y PUNTOS CONSTITUCIONALES',
    tipo: 'Comisión',
    fecha: '2026-09-03',
    horaInicio: '09:00',
    horaFin: '11:00',
    lugarNombre: 'Sala de Usos Múltiples en Congreso',
    lugarUrl: 'https://share.google/RSlrkI2maowYbwLnH',
    color: '#0284c7',
    notas: 'Revisión y dictamen de la iniciativa de reforma a la Ley Orgánica del Poder Legislativo.',
  },
  {
    id: 'evt-2',
    titulo: 'Sesión Solemne: Transición de Directiva del OBSERVATORIO DE PARTICIPACIÓN POLÍTICA DE LAS MUJERES',
    tipo: 'Sesión Solemne',
    fecha: '2026-09-03',
    horaInicio: '11:30',
    horaFin: '13:30',
    lugarNombre: 'IEPCT (Instituto Electoral y de Participación Ciudadana)',
    lugarUrl: 'https://share.google/Ns9yO6vsSIXS4zLMR',
    color: '#7c3aed',
    notas: 'Posicionamiento institucional en representación de la fracción parlamentaria.',
  },
  {
    id: 'evt-3',
    titulo: 'Audiencia Ciudadana y Entrega de Sillas de Ruedas (DIF / Territorio)',
    tipo: 'Atención Ciudadana',
    fecha: '2026-09-03',
    horaInicio: '16:00',
    horaFin: '18:00',
    lugarNombre: 'Casa de Enlace Parlamentario — Distrito 04',
    lugarUrl: 'https://maps.google.com/?q=Villahermosa+Tabasco',
    color: '#059669',
    notas: 'Recepción de 15 solicitudes de gestión vecinal y entrega de aparatos ortopédicos.',
  },
  {
    id: 'evt-4',
    titulo: 'Reunión de Trabajo con el Secretario de Ordenamiento Territorial (SOTOP)',
    tipo: 'Reunión de Trabajo',
    fecha: '2026-09-04',
    horaInicio: '10:00',
    horaFin: '12:00',
    lugarNombre: 'Oficinas Centrales de SOTOP',
    lugarUrl: 'https://maps.google.com/?q=SOTOP+Villahermosa',
    color: '#d97706',
    notas: 'Seguimiento a las obras de pavimentación y drenaje pluvial en Col. Atasta y San Pedro.',
  },
];

const INITIAL_TAREAS: TareaUsuario[] = [
  {
    id: 'tar-1',
    titulo: 'Validar y firmar proyecto de iniciativa de ley de salud mental',
    descripcion: 'Revisión final del articulado y exposición de motivos antes de ingreso formal a comisiones.',
    usuarioId: 'usr-1',
    usuarioNombre: 'Dip. Ruben Roque',
    usuarioFoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usuarioCargo: 'Diputado Local (Titular)',
    usuarioWhatsapp: '993 111 2233',
    prioridad: 'Alta',
    estatus: 'En Proceso',
    fechaLimite: '2026-09-04',
    horaLimite: '12:00',
    moduloRelacionado: 'Iniciativas',
  },
  {
    id: 'tar-2',
    titulo: 'Firma y entrega de oficios de apoyo médico para Hospital Dr. Juan Graham',
    descripcion: 'Canalización urgente de sesión de hemodiálisis de Juan Morales (GES-2026-089).',
    usuarioId: 'usr-1',
    usuarioNombre: 'Dip. Ruben Roque',
    usuarioFoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usuarioCargo: 'Diputado Local (Titular)',
    usuarioWhatsapp: '993 111 2233',
    prioridad: 'Alta',
    estatus: 'Pendiente',
    fechaLimite: '2026-09-03',
    horaLimite: '13:30',
    moduloRelacionado: 'Gestiones',
  },
  {
    id: 'tar-3',
    titulo: 'Aprobar discurso de posicionamiento para Sesión Solemne IEPCT',
    descripcion: 'Validar cifras de participación paritaria en los 17 municipios de Tabasco.',
    usuarioId: 'usr-1',
    usuarioNombre: 'Dip. Ruben Roque',
    usuarioFoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usuarioCargo: 'Diputado Local (Titular)',
    usuarioWhatsapp: '993 111 2233',
    prioridad: 'Alta',
    estatus: 'En Proceso',
    fechaLimite: '2026-09-03',
    horaLimite: '11:00',
    moduloRelacionado: 'Discursos',
  },
  {
    id: 'tar-4',
    titulo: 'Audiencia con líderes comunitarios de Col. San Pedro sobre luminarias',
    descripcion: 'Revisar reporte de territorio de 14 luminarias sin servicio.',
    usuarioId: 'usr-1',
    usuarioNombre: 'Dip. Ruben Roque',
    usuarioFoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usuarioCargo: 'Diputado Local (Titular)',
    usuarioWhatsapp: '993 111 2233',
    prioridad: 'Media',
    estatus: 'Pendiente',
    fechaLimite: '2026-09-03',
    horaLimite: '17:00',
    moduloRelacionado: 'Gestiones',
  },
  {
    id: 'tar-5',
    titulo: 'Emitir boletín de prensa de la Comisión de Gobernación',
    descripcion: 'Difundir en medios estatales la postura sobre la autonomía parlamentaria.',
    usuarioId: 'usr-5',
    usuarioNombre: 'Lic. Paulina Rovirosa Vega',
    usuarioFoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    usuarioCargo: 'Comunicación Social',
    usuarioWhatsapp: '993 888 7766',
    prioridad: 'Alta',
    estatus: 'En Proceso',
    fechaLimite: '2026-09-03',
    horaLimite: '15:00',
    moduloRelacionado: 'Boletines',
  },
];

const CUMPLEANEROS_DEL_DIA: CumpleaneroDirectorio[] = [
  {
    id: 'cump-1',
    nombre: 'Dra. Patricia Oramas Palma',
    cargo: 'Secretaria de Salud',
    organizacion: 'Secretaría de Salud Tabasco',
    telefono: '993 123 9988',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    fechaNacimiento: '03 de Septiembre',
  },
  {
    id: 'cump-2',
    nombre: 'Lic. Yolanda Osuna Huerta',
    cargo: 'Alcaldesa de Centro',
    organizacion: 'H. Ayuntamiento de Centro',
    telefono: '993 555 1212',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    fechaNacimiento: '03 de Septiembre',
  }
];

// 30 Days historical data for Gestiones
interface PuntoGrafico30Dias {
  dia: string;
  fechaCompleta: string;
  recibidas: number;
  enProceso: number;
  resueltas: number;
}

const DATOS_GRAFICO_30_DIAS: PuntoGrafico30Dias[] = [
  { dia: '08 Ago', fechaCompleta: '08 de Agosto', recibidas: 4, enProceso: 5, resueltas: 3 },
  { dia: '09 Ago', fechaCompleta: '09 de Agosto', recibidas: 5, enProceso: 6, resueltas: 4 },
  { dia: '10 Ago', fechaCompleta: '10 de Agosto', recibidas: 3, enProceso: 5, resueltas: 4 },
  { dia: '11 Ago', fechaCompleta: '11 de Agosto', recibidas: 7, enProceso: 7, resueltas: 5 },
  { dia: '12 Ago', fechaCompleta: '12 de Agosto', recibidas: 6, enProceso: 8, resueltas: 6 },
  { dia: '13 Ago', fechaCompleta: '13 de Agosto', recibidas: 8, enProceso: 9, resueltas: 7 },
  { dia: '14 Ago', fechaCompleta: '14 de Agosto', recibidas: 5, enProceso: 8, resueltas: 6 },
  { dia: '15 Ago', fechaCompleta: '15 de Agosto', recibidas: 9, enProceso: 10, resueltas: 8 },
  { dia: '16 Ago', fechaCompleta: '16 de Agosto', recibidas: 4, enProceso: 7, resueltas: 5 },
  { dia: '17 Ago', fechaCompleta: '17 de Agosto', recibidas: 6, enProceso: 8, resueltas: 7 },
  { dia: '18 Ago', fechaCompleta: '18 de Agosto', recibidas: 11, enProceso: 12, resueltas: 9 },
  { dia: '19 Ago', fechaCompleta: '19 de Agosto', recibidas: 8, enProceso: 11, resueltas: 8 },
  { dia: '20 Ago', fechaCompleta: '20 de Agosto', recibidas: 7, enProceso: 9, resueltas: 9 },
  { dia: '21 Ago', fechaCompleta: '21 de Agosto', recibidas: 12, enProceso: 13, resueltas: 11 },
  { dia: '22 Ago', fechaCompleta: '22 de Agosto', recibidas: 10, enProceso: 11, resueltas: 10 },
  { dia: '23 Ago', fechaCompleta: '23 de Agosto', recibidas: 6, enProceso: 9, resueltas: 8 },
  { dia: '24 Ago', fechaCompleta: '24 de Agosto', recibidas: 8, enProceso: 10, resueltas: 9 },
  { dia: '25 Ago', fechaCompleta: '25 de Agosto', recibidas: 14, enProceso: 14, resueltas: 12 },
  { dia: '26 Ago', fechaCompleta: '26 de Agosto', recibidas: 11, enProceso: 12, resueltas: 11 },
  { dia: '27 Ago', fechaCompleta: '27 de Agosto', recibidas: 9, enProceso: 10, resueltas: 10 },
  { dia: '28 Ago', fechaCompleta: '28 de Agosto', recibidas: 13, enProceso: 13, resueltas: 12 },
  { dia: '29 Ago', fechaCompleta: '29 de Agosto', recibidas: 15, enProceso: 14, resueltas: 13 },
  { dia: '30 Ago', fechaCompleta: '30 de Agosto', recibidas: 10, enProceso: 11, resueltas: 11 },
  { dia: '31 Ago', fechaCompleta: '31 de Agosto', recibidas: 12, enProceso: 12, resueltas: 12 },
  { dia: '01 Sep', fechaCompleta: '01 de Septiembre', recibidas: 16, enProceso: 14, resueltas: 14 },
  { dia: '02 Sep', fechaCompleta: '02 de Septiembre', recibidas: 14, enProceso: 12, resueltas: 13 },
  { dia: '03 Sep', fechaCompleta: '03 de Septiembre', recibidas: 18, enProceso: 15, resueltas: 16 },
  { dia: '04 Sep', fechaCompleta: '04 de Septiembre', recibidas: 13, enProceso: 11, resueltas: 12 },
  { dia: '05 Sep', fechaCompleta: '05 de Septiembre', recibidas: 15, enProceso: 12, resueltas: 14 },
  { dia: 'Hoy', fechaCompleta: '06 de Septiembre (Hoy)', recibidas: 17, enProceso: 13, resueltas: 15 }
];

export default function DashboardPage() {
  const [eventos, setEventos] = useState<EventoAgenda[]>(INITIAL_EVENTOS);
  const [tareas, setTareas] = useState<TareaUsuario[]>(INITIAL_TAREAS);

  // Agenda Filters
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-09-03');

  // Task Filters (ONLY Nuevas and En Proceso for Active User)
  const [filtroEstatusTarea, setFiltroEstatusTarea] = useState<'NUEVAS' | 'EN_PROCESO'>('NUEVAS');

  // Chart state & filters
  const [diasFiltroGrafico, setDiasFiltroGrafico] = useState<number>(30);
  const [hoveredPunto, setHoveredPunto] = useState<PuntoGrafico30Dias | null>(null);
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
  const [nuevaTareaFecha, setNuevaTareaFecha] = useState('2026-09-03');
  const [nuevaTareaHora, setNuevaTareaHora] = useState('14:00');
  const [nuevaTareaModulo, setNuevaTareaModulo] = useState('Gestiones');

  // New Event Form
  const [nuevoEvtTitulo, setNuevoEvtTitulo] = useState('');
  const [nuevoEvtTipo, setNuevoEvtTipo] = useState('Comisión');
  const [nuevoEvtFecha, setNuevoEvtFecha] = useState('2026-09-03');
  const [nuevoEvtHoraInicio, setNuevoEvtHoraInicio] = useState('10:00');
  const [nuevoEvtHoraFin, setNuevoEvtHoraFin] = useState('11:30');
  const [nuevoEvtLugar, setNuevoEvtLugar] = useState('Congreso del Estado');
  const [nuevoEvtLugarUrl, setNuevoEvtLugarUrl] = useState('https://maps.google.com');
  const [nuevoEvtNotas, setNuevoEvtNotas] = useState('');

  // Metrics calculation
  const gestionesNuevasCount = 4; // Recibidas
  const gestionesEnProcesoCount = 8; // En Revisión / En Trámite
  const tareasNuevasCount = tareas.filter(t => t.estatus === 'Pendiente').length;
  const tareasEnProcesoCount = tareas.filter(t => t.estatus === 'En Proceso').length;

  // Filtered Events
  const eventosDelDia = eventos.filter((e) => e.fecha === fechaSeleccionada);

  // Filtered Tasks for Active User ONLY (Nuevas and En Proceso)
  const misTareasAsignadas = tareas.filter(t => t.usuarioId === USUARIO_ACTIVO.id);
  const misTareasNuevas = misTareasAsignadas.filter(t => t.estatus === 'Pendiente');
  const misTareasEnProceso = misTareasAsignadas.filter(t => t.estatus === 'En Proceso');

  const tareasAMostrar = filtroEstatusTarea === 'NUEVAS' ? misTareasNuevas : misTareasEnProceso;

  const handleToggleCompletarTarea = (id: string) => {
    setTareas(tareas.map(t => {
      if (t.id === id) {
        return { ...t, estatus: 'Completada' };
      }
      return t;
    }));
  };

  const handleCambiarEstatusTarea = (id: string, nuevoEstatus: 'Pendiente' | 'En Proceso') => {
    setTareas(tareas.map(t => {
      if (t.id === id) {
        return { ...t, estatus: nuevoEstatus };
      }
      return t;
    }));
  };

  const handleEliminarTarea = (id: string) => {
    setTareas(tareas.filter(t => t.id !== id));
  };

  const handleCrearTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim()) return;

    const nueva: TareaUsuario = {
      id: `tar-${Date.now()}`,
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
    };

    setTareas([nueva, ...tareas]);
    setNuevaTareaTitulo('');
    setNuevaTareaDesc('');
    setIsModalTareaOpen(false);
  };

  const handleCrearEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEvtTitulo.trim()) return;

    const nuevo: EventoAgenda = {
      id: `evt-${Date.now()}`,
      titulo: nuevoEvtTitulo.trim(),
      tipo: nuevoEvtTipo,
      fecha: nuevoEvtFecha,
      horaInicio: nuevoEvtHoraInicio,
      horaFin: nuevoEvtHoraFin,
      lugarNombre: nuevoEvtLugar.trim(),
      lugarUrl: nuevoEvtLugarUrl.trim() || 'https://maps.google.com',
      color: '#0284c7',
      notas: nuevoEvtNotas.trim(),
    };

    setEventos([...eventos, nuevo]);
    setNuevoEvtTitulo('');
    setNuevoEvtNotas('');
    setIsModalEventoOpen(false);
  };

  const handleCompartirWhatsappDia = () => {
    if (eventosDelDia.length === 0) return;
    let mensaje = `🏛️ *AGENDA OFICIAL — DIP. RUBEN ROQUE*
📅 Fecha: ${fechaSeleccionada}

`;
    eventosDelDia.forEach((ev, idx) => {
      mensaje += `🟢 *${idx + 1}. ${ev.titulo}*
⏰ ${ev.horaInicio} - ${ev.horaFin}
🏢 Lugar: ${ev.lugarNombre}
📍 ${ev.lugarUrl}

`;
    });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Slice data for chart based on selected days
  const puntosFiltrados = DATOS_GRAFICO_30_DIAS.slice(-diasFiltroGrafico);
  
  // Calculate chart statistics for the selected period
  const totalRecibidasPeriodo = puntosFiltrados.reduce((acc, p) => acc + p.recibidas, 0);
  const totalResueltasPeriodo = puntosFiltrados.reduce((acc, p) => acc + p.resueltas, 0);
  const promedioEnProcesoPeriodo = Math.round(puntosFiltrados.reduce((acc, p) => acc + p.enProceso, 0) / puntosFiltrados.length);
  const tasaResolucionPeriodo = Math.round((totalResueltasPeriodo / totalRecibidasPeriodo) * 100);

  // SVG Chart Geometry
  const svgWidth = 1000;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 40;

  const maxVal = Math.max(...puntosFiltrados.flatMap(p => [p.recibidas, p.enProceso, p.resueltas])) + 2;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingX + (index / (puntosFiltrados.length - 1)) * innerWidth;
  const getY = (val: number) => paddingTop + innerHeight - (val / maxVal) * innerHeight;

  // Generate SVG Bezier Path
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

  const areaResueltas = `${pathResueltas} L ${pointsResueltas[pointsResueltas.length - 1].x},${paddingTop + innerHeight} L ${pointsResueltas[0].x},${paddingTop + innerHeight} Z`;

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          1. BARRA MINIMALISTA DE 100% (LINEAR MINIMALIST TOP BAR)
             - Gestiones nuevas
             - Gestiones en proceso
             - Tareas nuevas
             - Tareas en proceso
         ========================================================================= */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1.1 Gestiones Nuevas */}
        <Link 
          href="/gestiones"
          className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Gestiones Nuevas</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-zinc-900">{gestionesNuevasCount}</span>
              <span className="text-xs text-zinc-400 font-medium">solicitudes</span>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              Recibidas
            </span>
          </div>
        </Link>

        {/* 1.2 Gestiones en Proceso */}
        <Link 
          href="/gestiones"
          className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Gestiones en Proceso</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-purple-700">{gestionesEnProcesoCount}</span>
              <span className="text-xs text-zinc-400 font-medium">en trámite</span>
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
              En Seguimiento
            </span>
          </div>
        </Link>

        {/* 1.3 Tareas Nuevas */}
        <Link 
          href="/tareas"
          className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Tareas Nuevas</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-amber-700">{tareasNuevasCount}</span>
              <span className="text-xs text-zinc-400 font-medium">por iniciar</span>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              Pendientes
            </span>
          </div>
        </Link>

        {/* 1.4 Tareas en Proceso */}
        <Link 
          href="/tareas"
          className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Tareas en Proceso</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-emerald-700">{tareasEnProcesoCount}</span>
              <span className="text-xs text-zinc-400 font-medium">en curso</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
              En Ejecución
            </span>
          </div>
        </Link>
      </div>


      {/* =========================================================================
          2. GRÁFICO DE LÍNEAS DE LOS ÚLTIMOS 30 DÍAS AL 100% DE ANCHO
             - Rendimiento de Gestiones Ciudadanas
             - Gestiones Resueltas (Verde / Emerald)
             - Gestiones Recibidas (Azul / Blue)
             - Gestiones en Proceso (Morado / Purple)
         ========================================================================= */}
      <div className="w-full bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        
        {/* Header del Gráfico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center border border-zinc-200">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Rendimiento de Gestiones Ciudadanas
              </h2>
              <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                Últimos {diasFiltroGrafico} días
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Monitoreo continuo de solicitudes ciudadanas: flujo de ingreso, trámite activo y resolución parlamentaria.
            </p>
          </div>

          {/* Controles y Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Legend / Toggles */}
            <div className="flex items-center gap-3 text-xs bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, resueltas: !prev.resueltas }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.resueltas ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                <span className="text-zinc-700">Resueltas</span>
              </button>

              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, recibidas: !prev.recibidas }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.recibidas ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-2xs"></span>
                <span className="text-zinc-700">Recibidas</span>
              </button>

              <button
                type="button"
                onClick={() => setLineasVisibles(prev => ({ ...prev, enProceso: !prev.enProceso }))}
                className={`flex items-center gap-1.5 font-medium transition-opacity ${lineasVisibles.enProceso ? 'opacity-100' : 'opacity-30'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-2xs"></span>
                <span className="text-zinc-700">En Proceso</span>
              </button>
            </div>

            {/* Rango de Días */}
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

        {/* Resumen de Métricas del Periodo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Recibidas</span>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{totalRecibidasPeriodo}</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Resueltas</span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{totalResueltasPeriodo}</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Promedio en Proceso</span>
            <p className="text-lg font-bold text-purple-600 mt-0.5">{promedioEnProcesoPeriodo} / día</p>
          </div>
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Eficacia de Resolución</span>
            <p className="text-lg font-bold text-zinc-900 mt-0.5">{tasaResolucionPeriodo}%</p>
          </div>
        </div>

        {/* Canvas SVG Interactivo de 100% de Ancho */}
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

            {/* Grid Horizontal Lines */}
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

            {/* Area Fill for Resueltas */}
            {lineasVisibles.resueltas && (
              <path d={areaResueltas} fill="url(#gradientResueltas)" />
            )}

            {/* Line: Gestiones Recibidas (Blue) */}
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

            {/* Line: Gestiones En Proceso (Purple) */}
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

            {/* Line: Gestiones Resueltas (Emerald) */}
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

            {/* Interactive Points and Hover Tracking Columns */}
            {puntosFiltrados.map((p, idx) => {
              const x = getX(idx);
              const isHovered = hoveredPunto?.dia === p.dia;
              const stepLabel = diasFiltroGrafico === 30 ? (idx % 3 === 0 || idx === puntosFiltrados.length - 1) : true;

              return (
                <g key={idx}>
                  {/* Invisible Vertical Hit Area for Hover */}
                  <rect
                    x={x - (innerWidth / puntosFiltrados.length) / 2}
                    y={paddingTop}
                    width={innerWidth / puntosFiltrados.length}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredPunto(p);
                      setHoveredPos({ x, y: getY(p.resueltas) });
                    }}
                    onMouseLeave={() => setHoveredPunto(null)}
                  />

                  {/* Vertical Guide on Hover */}
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

                  {/* Dots for Resueltas */}
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

                  {/* Dots for Recibidas */}
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

                  {/* Dots for En Proceso */}
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

                  {/* X Axis Labels */}
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

          {/* Floating Tooltip Card */}
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

        {/* Footer del Gráfico con enlace directo al módulo */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Datos actualizados en tiempo real con el registro de Atenciones y Gestiones.</span>
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
          3. MAIN GRID: 2/3 AGENDA DEL DÍA (Left) + 1/3 TAREAS Y CUMPLEAÑOS (Right)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* =========================================================================
            COLUMNA 2/3: AGENDA DEL DÍA
           ========================================================================= */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5 transition-colors">
          {/* Header de la Agenda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">Agenda del día</h2>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Google Calendar Live
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Horarios, comisiones, sedes y compartir por WhatsApp</p>
              </div>
            </div>

            {/* Controles de Fecha */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setFechaSeleccionada('2026-09-03')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fechaSeleccionada === '2026-09-03' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500'
                  }`}
                >
                  Hoy (3 Sep)
                </button>
                <button
                  onClick={() => setFechaSeleccionada('2026-09-04')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fechaSeleccionada === '2026-09-04' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500'
                  }`}
                >
                  Mañana (4 Sep)
                </button>
              </div>

              <button
                onClick={handleCompartirWhatsappDia}
                disabled={eventosDelDia.length === 0}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                title="Compartir agenda del día por WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Compartir</span>
              </button>
            </div>
          </div>

          {/* Timeline / Lista de Eventos de la Agenda */}
          <div className="space-y-3">
            {eventosDelDia.length > 0 ? (
              eventosDelDia.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-xs transition-all space-y-2.5 group relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                        {ev.tipo}
                      </span>
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        ⏰ {ev.horaInicio} - {ev.horaFin}
                      </span>
                    </div>

                    <a
                      href={ev.lugarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-blue-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg transition-colors truncate max-w-xs"
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                      <span className="truncate">{ev.lugarNombre}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {ev.titulo}
                  </h3>

                  {ev.notas && (
                    <p className="text-xs text-zinc-600 bg-white p-2.5 rounded-xl border border-zinc-200/70 leading-relaxed">
                      {ev.notas}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 space-y-2">
                <CalendarIcon className="h-7 w-7 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-600">No hay eventos programados para esta fecha.</p>
              </div>
            )}
          </div>

          {/* Footer de la Agenda */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsModalEventoOpen(true)}
              className="inline-flex items-center gap-1 text-zinc-900 font-semibold hover:text-blue-600"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Agregar Evento a la Agenda</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            COLUMNA 1/3: MIS TAREAS + CUMPLEAÑOS DEL DÍA ABAJO
           ========================================================================= */}
        <div className="space-y-6">
          
          {/* MIS TAREAS ASIGNADAS */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5 transition-colors">
            {/* Header de Mis Tareas con perfil de usuario activo */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <CheckSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-zinc-900">Mis Tareas</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={USUARIO_ACTIVO.foto} alt={USUARIO_ACTIVO.nombre} className="h-4 w-4 rounded-full object-cover" />
                    <span className="font-semibold text-zinc-700">{USUARIO_ACTIVO.nombre}</span>
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

            {/* Filtro Exclusivo: NUEVAS y EN PROCESO */}
            <div className="flex items-center justify-between gap-1.5 p-1 bg-zinc-100 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFiltroEstatusTarea('NUEVAS')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
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

            {/* Lista de Tareas Asignadas al Usuario Activo */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {tareasAMostrar.length > 0 ? (
                tareasAMostrar.map((tarea) => {
                  return (
                    <div
                      key={tarea.id}
                      className="p-3.5 rounded-2xl border border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-2xs transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start gap-2.5">
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

                      {/* Footer de la Tarea */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                        <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                          📁 {tarea.moduloRelacionado}
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
                    No tienes tareas {filtroEstatusTarea === 'NUEVAS' ? 'nuevas' : 'en proceso'} asignadas.
                  </p>
                  <p className="text-[10px] text-zinc-400">¡Tu bandeja de pendientes está al día!</p>
                </div>
              )}
            </div>

            {/* Footer de Tareas */}
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
                <span>Ver Tablero Completo</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>


          {/* CUMPLEAÑOS DEL DÍA (ABRICADO ABAJO DE TAREAS) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Cake className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Cumpleaños del día</h3>
                  <p className="text-[11px] text-zinc-500">Contactos del Directorio Institucional</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {CUMPLEANEROS_DEL_DIA.length} Hoy
              </span>
            </div>

            <div className="space-y-2">
              {CUMPLEANEROS_DEL_DIA.map((cump) => (
                <div
                  key={cump.id}
                  className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-200/70 flex items-center justify-between gap-3 hover:bg-white hover:border-zinc-300 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cump.foto}
                      alt={cump.nombre}
                      className="h-9 w-9 rounded-full object-cover border border-zinc-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate leading-tight">{cump.nombre}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{cump.cargo} • {cump.organizacion}</p>
                    </div>
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?phone=52${cump.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Estimado(a) ${cump.nombre}, le envío una cordial felicitación con motivo de su cumpleaños. ¡Que pase un excelente día! Atte: Dip. Ruben Roque.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    title="Felicitar por WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Felicitar</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">Notificaciones automáticas matutinas</span>
              <Link
                href="/directorio"
                className="text-xs font-semibold text-zinc-900 hover:text-blue-600 flex items-center gap-1"
              >
                <span>Ver Directorio</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
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
