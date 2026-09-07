'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserMinus,
  UsersRound,
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Plus, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  ArrowUpRight, 
  Trash2,
  FolderKanban,
  Cake,
  PartyPopper,
  Users,
  Flame,
  UserCheck,
  Check
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


interface MiembroGrupoDash {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  municipio: string;
  foto: string;
}

interface GrupoDashboard {
  id: string;
  nombre: string;
  categoria: string;
  color: string;
  whatsappLink?: string;
  miembros: MiembroGrupoDash[];
}

const INITIAL_GRUPOS_DASHBOARD: GrupoDashboard[] = [
  {
    id: 'grp-1',
    nombre: 'Líderes y Enlaces - Distrito 04',
    categoria: 'Líderes Seccionales',
    color: 'blue',
    whatsappLink: 'https://chat.whatsapp.com/sampleLinkDistrito04',
    miembros: [
      { id: 'm1', nombre: 'Ing. Carlos Mendoza', cargo: 'Coordinador Centro', telefono: '993 123 4567', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'm2', nombre: 'Lic. Mariana Solís', cargo: 'Gestora Gaviotas', telefono: '993 987 6543', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { id: 'm3', nombre: 'Profr. Roberto Méndez', cargo: 'Enlace Tamulté', telefono: '993 456 7890', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    ]
  },
  {
    id: 'grp-2',
    nombre: 'Comité de Agua y Servicios Tamulté',
    categoria: 'Comunitario',
    color: 'emerald',
    whatsappLink: 'https://chat.whatsapp.com/sampleLinkAguaTamulte',
    miembros: [
      { id: 'm4', nombre: 'Sra. Rosa Gómez', cargo: 'Presidenta de Vecinos', telefono: '993 234 5678', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { id: 'm5', nombre: 'Don Javier Osorio', cargo: 'Vocal de Vigilancia', telefono: '993 345 6789', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    ]
  },
  {
    id: 'grp-3',
    nombre: 'Prensa y Corresponsales Tabasco',
    categoria: 'Medios',
    color: 'purple',
    whatsappLink: 'https://chat.whatsapp.com/sampleLinkPrensaTab',
    miembros: [
      { id: 'm6', nombre: 'Lic. Héctor Morales', cargo: 'Editor Tabasco Hoy', telefono: '993 876 5432', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
      { id: 'm7', nombre: 'Claudia Rivera', cargo: 'Reportera TV Azteca', telefono: '993 765 4321', municipio: 'Centro', foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    ]
  }
];

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
  // Other team members' tasks (visible in /tareas)
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
    cargo: 'Secretaria de Salud del Estado',
    organizacion: 'Secretaría de Salud Tabasco',
    telefono: '993 123 9988',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    fechaNacimiento: '03 de Septiembre',
  },
  {
    id: 'cump-2',
    nombre: 'Lic. Yolanda Osuna Huerta',
    cargo: 'Presidenta Municipal de Centro',
    organizacion: 'H. Ayuntamiento de Centro',
    telefono: '993 555 1212',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    fechaNacimiento: '03 de Septiembre',
  }
];

export default function DashboardPage() {
  const [gruposDashboard, setGruposDashboard] = useState<GrupoDashboard[]>(INITIAL_GRUPOS_DASHBOARD);
  const [grupoActivoId, setGrupoActivoId] = useState<string>('grp-1');
  const [mensajeNotificacionGrupo, setMensajeNotificacionGrupo] = useState<string | null>(null);

  const handleQuitarMiembroDeGrupo = (grupoId: string, miembroId: string, miembroNombre: string) => {
    setGruposDashboard(prev => prev.map(grp => {
      if (grp.id === grupoId) {
        return {
          ...grp,
          miembros: grp.miembros.filter(m => m.id !== miembroId)
        };
      }
      return grp;
    }));
    setMensajeNotificacionGrupo(`✓ Se quitó a "${miembroNombre}" del grupo.`);
    setTimeout(() => setMensajeNotificacionGrupo(null), 3000);
  };

  const [eventos, setEventos] = useState<EventoAgenda[]>(INITIAL_EVENTOS);
  const [tareas, setTareas] = useState<TareaUsuario[]>(INITIAL_TAREAS);

  // Agenda Filters
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('2026-09-03');

  // Task Filters (ONLY Nuevas and En Proceso for Active User)
  const [filtroEstatusTarea, setFiltroEstatusTarea] = useState<'NUEVAS' | 'EN_PROCESO'>('NUEVAS');

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
    let mensaje = `🏛️ *AGENDA OFICIAL — DIP. RUBEN ROQUE*\n📅 Fecha: ${fechaSeleccionada}\n\n`;
    eventosDelDia.forEach((ev, idx) => {
      mensaje += `🟢 *${idx + 1}. ${ev.titulo}*\n⏰ ${ev.horaInicio} - ${ev.horaFin}\n🏢 Lugar: ${ev.lugarNombre}\n📍 ${ev.lugarUrl}\n\n`;
    });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          WIDGET: GESTIÓN RÁPIDA DE GRUPOS DIRECTAMENTE DESDE EL DASHBOARD
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Grupos y Redes de Contactos</h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Acción Directa
                </span>
              </div>
              <p className="text-xs text-zinc-500">Administra o quita usuarios de un grupo directamente con el botón de acción rápida</p>
            </div>
          </div>

          <Link
            href="/grupos"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver Módulo Grupos Completo</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {mensajeNotificacionGrupo && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
            <span>{mensajeNotificacionGrupo}</span>
            <button onClick={() => setMensajeNotificacionGrupo(null)} className="text-emerald-600 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Pestañas de Grupos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {gruposDashboard.map((grp) => {
            const isSelected = grupoActivoId === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => setGrupoActivoId(grp.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-gray-200'
                }`}
              >
                <span>{grp.nombre}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-zinc-700'
                }`}>
                  {grp.miembros.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de Miembros con Botón de Quitar */}
        {(() => {
          const currentGrupo = gruposDashboard.find(g => g.id === grupoActivoId);
          if (!currentGrupo) return null;

          return (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-semibold">
                  Integrantes ({currentGrupo.miembros.length}):
                </span>
                {currentGrupo.whatsappLink && (
                  <a
                    href={currentGrupo.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold bg-green-50 px-2.5 py-1 rounded-lg text-[11px] border border-green-200"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                    <span>Abrir Chat de WhatsApp</span>
                  </a>
                )}
              </div>

              {currentGrupo.miembros.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentGrupo.miembros.map((mb) => (
                    <div
                      key={mb.id}
                      className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-between gap-3 hover:bg-white hover:border-gray-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mb.foto}
                          alt={mb.nombre}
                          className="h-9 w-9 rounded-full object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">{mb.nombre}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{mb.cargo} • {mb.municipio}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://wa.me/52${mb.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>

                        {/* BOTÓN QUITAR DEL GRUPO */}
                        <button
                          onClick={() => handleQuitarMiembroDeGrupo(currentGrupo.id, mb.id, mb.nombre)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-lg transition-colors shadow-2xs"
                          title={`Quitar a ${mb.nombre} de este grupo`}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-xs text-zinc-400">
                  No hay miembros en este grupo actualmente.
                </div>
              )}
            </div>
          );
        })()}
      </div>


      {/* =========================================================================
          FULL-WIDTH TOP BAR: GESTIONES NUEVAS, GESTIONES EN PROCESO, TAREAS NUEVAS,
          TAREAS EN PROCESO, Y CUMPLEAÑOS DEL DÍA (DIRECTORIO)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        {/* 1. Gestiones Nuevas */}
        <Link 
          href="/gestiones"
          className="bg-white dark:bg-[#121824] p-5 rounded-2xl border border-zinc-200/80 dark:border-gray-800 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gestiones Nuevas</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{gestionesNuevasCount}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Recibidas
            </span>
          </div>
        </Link>

        {/* 2. Gestiones en Proceso */}
        <Link 
          href="/gestiones"
          className="bg-white dark:bg-[#121824] p-5 rounded-2xl border border-zinc-200/80 dark:border-gray-800 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gestiones en Proceso</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{gestionesEnProcesoCount}</span>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              En Trámite
            </span>
          </div>
        </Link>

        {/* 3. Tareas Nuevas */}
        <Link 
          href="/tareas"
          className="bg-white dark:bg-[#121824] p-5 rounded-2xl border border-zinc-200/80 dark:border-gray-800 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tareas Nuevas</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{tareasNuevasCount}</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Pendientes
            </span>
          </div>
        </Link>

        {/* 4. Tareas en Proceso */}
        <Link 
          href="/tareas"
          className="bg-white dark:bg-[#121824] p-5 rounded-2xl border border-zinc-200/80 dark:border-gray-800 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tareas en Proceso</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{tareasEnProcesoCount}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              En Ejecución
            </span>
          </div>
        </Link>

        {/* 5. CUMPLEAÑOS DEL DÍA (DIRECTORIO) */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-4 rounded-2xl shadow-md shadow-amber-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-100">
              <Cake className="h-3.5 w-3.5" />
              <span>Cumpleaños del Día</span>
            </span>
            <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
              {CUMPLEANEROS_DEL_DIA.length} Hoy
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            {CUMPLEANEROS_DEL_DIA.map((cump) => (
              <div key={cump.id} className="flex items-center justify-between gap-1.5 bg-black/15 p-1.5 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cump.foto}
                    alt={cump.nombre}
                    className="h-6 w-6 rounded-full object-cover border border-white/80 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate leading-tight">{cump.nombre}</p>
                    <p className="text-[9px] text-amber-100 truncate">{cump.cargo}</p>
                  </div>
                </div>

                <a
                  href={`https://api.whatsapp.com/send?phone=52${cump.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Estimado(a) ${cump.nombre}, le envío una cordial felicitación con motivo de su cumpleaños. ¡Que pase un excelente día! Atte: Dip. Ruben Roque.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 bg-white hover:bg-emerald-50 text-[#00a884] rounded-lg transition-colors shrink-0 shadow-2xs"
                  title="Felicitar por WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>

          <Link
            href="/directorio"
            className="text-[10px] font-bold text-amber-100 hover:text-white mt-1.5 flex items-center justify-between hover:underline pt-1 border-t border-white/20"
          >
            <span>Ver Directorio Completo</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MAIN GRID: 2/3 AGENDA (Left) + 1/3 TAREAS PENDIENTES (Right)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* =========================================================================
            COLUMNA 2/3: AGENDA PARLAMENTARIA Y GOOGLE CALENDAR
           ========================================================================= */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121824] rounded-2xl border border-zinc-200/80 dark:border-gray-800 p-6 shadow-xs space-y-5 transition-colors">
          {/* Header de la Agenda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">Agenda Oficial y Sesiones</h2>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Google Calendar Live
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Horarios de 1 hora, comisiones, sedes y compartir por WhatsApp</p>
              </div>
            </div>

            {/* Controles de Fecha */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFechaSeleccionada('2026-09-03')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fechaSeleccionada === '2026-09-03' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600 dark:text-gray-300'
                  }`}
                >
                  Hoy (3 Sep)
                </button>
                <button
                  onClick={() => setFechaSeleccionada('2026-09-04')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    fechaSeleccionada === '2026-09-04' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-zinc-600 dark:text-gray-300'
                  }`}
                >
                  Mañana (4 Sep)
                </button>
              </div>

              <button
                onClick={handleCompartirWhatsappDia}
                disabled={eventosDelDia.length === 0}
                className="inline-flex items-center gap-1.5 bg-[#00a884] hover:bg-[#008f6f] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                title="Compartir agenda del día por WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Compartir</span>
              </button>
            </div>
          </div>

          {/* Timeline / Lista de Eventos de la Agenda */}
          <div className="space-y-3.5">
            {eventosDelDia.length > 0 ? (
              eventosDelDia.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-zinc-200/80 dark:border-gray-800/90 bg-zinc-50 dark:bg-gray-800/40/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all space-y-2.5 group relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-zinc-200/80 dark:border-gray-800">
                        {ev.tipo}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        ⏰ {ev.horaInicio} - {ev.horaFin}
                      </span>
                    </div>

                    <a
                      href={ev.lugarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors truncate max-w-xs"
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                      <span className="truncate">{ev.lugarNombre}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                    {ev.titulo}
                  </h3>

                  {ev.notas && (
                    <p className="text-xs text-zinc-600 dark:text-gray-300 bg-white p-2.5 rounded-xl border border-zinc-100 dark:border-gray-800 leading-relaxed">
                      {ev.notas}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200/80 dark:border-gray-800 bg-zinc-50 dark:bg-gray-800/40/50 space-y-2">
                <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-zinc-600 dark:text-gray-300">No hay eventos programados para esta fecha.</p>
              </div>
            )}
          </div>

          {/* Footer de la Agenda con enlace al módulo completo */}
          <div className="pt-2 border-t border-zinc-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsModalEventoOpen(true)}
              className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Agregar Evento a la Agenda</span>
            </button>

            <Link
              href="/agenda"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              <span>Ver Calendario Google Completo</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* =========================================================================
            COLUMNA 1/3: MIS TAREAS ASIGNADAS (SOLO NUEVAS Y EN PROCESO)
           ========================================================================= */}
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-zinc-200/80 dark:border-gray-800 p-6 shadow-xs space-y-5 transition-colors">
          {/* Header de Mis Tareas con perfil de usuario activo */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">Mis Tareas Pendientes</h2>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={USUARIO_ACTIVO.foto} alt={USUARIO_ACTIVO.nombre} className="h-4 w-4 rounded-full object-cover" />
                  <span className="font-semibold text-zinc-700 dark:text-gray-200">{USUARIO_ACTIVO.nombre}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalTareaOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Nueva Tarea Personal"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Filtro Exclusivo: NUEVAS y EN PROCESO */}
          <div className="flex items-center justify-between gap-1.5 p-1 bg-zinc-100 dark:bg-gray-800 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setFiltroEstatusTarea('NUEVAS')}
              className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                filtroEstatusTarea === 'NUEVAS' 
                  ? 'bg-white text-amber-700 shadow-xs font-bold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-gray-100'
              }`}
            >
              <span>Nuevas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filtroEstatusTarea === 'NUEVAS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-zinc-600 dark:text-gray-300'
              }`}>
                {misTareasNuevas.length}
              </span>
            </button>

            <button
              onClick={() => setFiltroEstatusTarea('EN_PROCESO')}
              className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                filtroEstatusTarea === 'EN_PROCESO' 
                  ? 'bg-white text-blue-700 shadow-xs font-bold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-gray-100'
              }`}
            >
              <span>En Proceso</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filtroEstatusTarea === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-zinc-600 dark:text-gray-300'
              }`}>
                {misTareasEnProceso.length}
              </span>
            </button>
          </div>

          {/* Lista de Tareas Asignadas al Usuario Activo */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {tareasAMostrar.length > 0 ? (
              tareasAMostrar.map((tarea) => {
                return (
                  <div
                    key={tarea.id}
                    className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-gray-800 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5 group"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox para completar */}
                      <button
                        type="button"
                        onClick={() => handleToggleCompletarTarea(tarea.id)}
                        className="mt-0.5 text-slate-300 hover:text-emerald-600 transition-colors shrink-0"
                        title="Marcar como completada y retirar de pendientes"
                      >
                        <Circle className="h-4 w-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tarea.prioridad === 'Alta' ? 'bg-red-50 text-red-700 border border-red-200' :
                            tarea.prioridad === 'Media' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-zinc-100 dark:bg-gray-800 text-zinc-600 dark:text-gray-300 border border-zinc-200/80 dark:border-gray-800'
                          }`}>
                            {tarea.prioridad}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400">
                            ⏰ {tarea.horaLimite}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold mt-1 text-zinc-900 dark:text-white leading-tight">
                          {tarea.titulo}
                        </h4>

                        {tarea.descripcion && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {tarea.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer de la Tarea: Módulo + Botón de acción */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                      <span className="bg-zinc-100 dark:bg-gray-800 text-zinc-700 dark:text-gray-200 px-2 py-0.5 rounded-md font-medium">
                        📁 {tarea.moduloRelacionado}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {tarea.estatus === 'Pendiente' ? (
                          <button
                            onClick={() => handleCambiarEstatusTarea(tarea.id, 'En Proceso')}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Iniciar ➔
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleCompletarTarea(tarea.id)}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            ✓ Concluir
                          </button>
                        )}

                        <button
                          onClick={() => handleEliminarTarea(tarea.id)}
                          className="p-1 text-slate-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200/80 dark:border-gray-800 bg-zinc-50 dark:bg-gray-800/40/50 space-y-2">
                <CheckSquare className="h-7 w-7 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-zinc-600 dark:text-gray-300">
                  No tienes tareas {filtroEstatusTarea === 'NUEVAS' ? 'nuevas' : 'en proceso'} asignadas.
                </p>
                <p className="text-[10px] text-slate-400">¡Tu bandeja de pendientes está al día!</p>
              </div>
            )}
          </div>

          {/* Footer de Tareas con enlace a /tareas */}
          <div className="pt-2 border-t border-zinc-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsModalTareaOpen(true)}
              className="text-blue-600 font-bold hover:underline"
            >
              + Asignar Tarea
            </button>
            <Link
              href="/tareas"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver Tablero del Equipo</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: NUEVA TAREA */}
      {isModalTareaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                Asignar Tarea Personal
              </h3>
              <button onClick={() => setIsModalTareaOpen(false)} className="text-slate-400 hover:text-zinc-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearTarea} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Título de la Tarea <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevaTareaTitulo}
                  onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                  placeholder="Ej: Revisar dictamen de comisiones..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Prioridad</label>
                  <select
                    value={nuevaTareaPrioridad}
                    onChange={(e) => setNuevaTareaPrioridad(e.target.value as any)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Módulo Vinculado</label>
                  <select
                    value={nuevaTareaModulo}
                    onChange={(e) => setNuevaTareaModulo(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
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
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Fecha Límite <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={nuevaTareaFecha}
                    onChange={(e) => setNuevaTareaFecha(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-zinc-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Hora Límite <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="time"
                    value={nuevaTareaHora}
                    onChange={(e) => setNuevaTareaHora(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-zinc-800 dark:text-gray-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Instrucciones / Descripción</label>
                <textarea
                  rows={2}
                  value={nuevaTareaDesc}
                  onChange={(e) => setNuevaTareaDesc(e.target.value)}
                  placeholder="Detalles sobre lo que se debe realizar y entregar..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalTareaOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 dark:text-gray-300 hover:bg-zinc-100 dark:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Registrar Evento en Agenda
              </h3>
              <button onClick={() => setIsModalEventoOpen(false)} className="text-slate-400 hover:text-zinc-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearEvento} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Título del Evento <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevoEvtTitulo}
                  onChange={(e) => setNuevoEvtTitulo(e.target.value)}
                  placeholder="Ej: Sesión Ordinaria de Pleno..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Tipo de Evento</label>
                  <select
                    value={nuevoEvtTipo}
                    onChange={(e) => setNuevoEvtTipo(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
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
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={nuevoEvtFecha}
                    onChange={(e) => setNuevoEvtFecha(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={nuevoEvtHoraInicio}
                    onChange={(e) => setNuevoEvtHoraInicio(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={nuevoEvtHoraFin}
                    onChange={(e) => setNuevoEvtHoraFin(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Lugar / Sede Oficial</label>
                <input
                  type="text"
                  value={nuevoEvtLugar}
                  onChange={(e) => setNuevoEvtLugar(e.target.value)}
                  placeholder="Ej: Sala de Comisiones en Congreso"
                  className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Enlace de Ubicación (Google Maps)</label>
                <input
                  type="url"
                  value={nuevoEvtLugarUrl}
                  onChange={(e) => setNuevoEvtLugarUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-gray-200 mb-1">Notas / Puntos a tratar</label>
                <textarea
                  rows={2}
                  value={nuevoEvtNotas}
                  onChange={(e) => setNuevoEvtNotas(e.target.value)}
                  placeholder="Asuntos a tratar en el evento..."
                  className="w-full p-2 bg-zinc-50 dark:bg-gray-800/40 border border-zinc-200/80 dark:border-gray-800 rounded-xl text-zinc-800 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalEventoOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 dark:text-gray-300 hover:bg-zinc-100 dark:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
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
