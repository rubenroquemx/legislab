'use client';

import { useState, useRef, useEffect } from 'react';
import { getTareas, createTarea, updateTareaStatus, deleteTarea } from '@/app/actions/tareas';
import { 
  CheckSquare, 
  Kanban, 
  LayoutList, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  MessageCircle, 
  Edit, 
  Trash2, 
  User, 
  Briefcase, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Flame,
  Check,
  X,
  GripVertical,
  Calendar,
  Send,
  CheckCheck,
  StickyNote
} from 'lucide-react';

export type EstadoTarea = 'Pendiente' | 'En Proceso' | 'En Revisión' | 'Completada';

export interface ObservacionTarea {
  id: string;
  fecha: string;
  hora: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}

export interface TareaDespacho {
  id: string;
  titulo: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioFoto: string;
  usuarioCargo: string;
  usuarioWhatsapp: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estatus: EstadoTarea;
  fechaLimite: string;
  horaLimite: string;
  moduloRelacionado: string;
  fechaCreacion: string;
  observaciones: ObservacionTarea[];
}

const ESTADOS_KANBAN_TAREAS: EstadoTarea[] = ['Pendiente', 'En Proceso', 'En Revisión', 'Completada'];

const MODULOS_SISTEMA_LIST = ['Gestiones', 'Iniciativas', 'Agenda', 'Boletines', 'Discursos', 'Medios', 'Usuarios', 'General'];

const USUARIOS_EQUIPO = [
  { id: 'usr-1', nombre: 'Dip. Ruben Roque', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', cargo: 'Diputado Local (Titular)', whatsapp: '993 111 2233' },
  { id: 'usr-2', nombre: 'Lic. Mariana Soto Gómez', foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', cargo: 'Asesora Jurídica', whatsapp: '993 456 7890' },
  { id: 'usr-3', nombre: 'Lic. Roberto Garza Priego', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', cargo: 'Secretario Técnico', whatsapp: '993 321 6549' },
  { id: 'usr-4', nombre: 'Ing. Carlos Alberto Morales', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', cargo: 'Enlace Territorio', whatsapp: '993 789 1234' },
  { id: 'usr-5', nombre: 'Lic. Paulina Rovirosa Vega', foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', cargo: 'Comunicación Social', whatsapp: '993 888 7766' },
  { id: 'usr-6', nombre: 'L.A.E. Sofía Méndez Narváez', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', cargo: 'Gestión Social', whatsapp: '993 999 4455' },
];

const INITIAL_TAREAS: TareaDespacho[] = [];

export default function TareasPage() {
  const [tareas, setTareas] = useState<TareaDespacho[]>(INITIAL_TAREAS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getTareas();
        if (res.success && res.data && res.data.length > 0) {
          const mapped: TareaDespacho[] = res.data.map((d: any) => ({
            id: d.id,
            titulo: d.titulo,
            descripcion: d.descripcion || '',
            usuarioId: d.usuarioId || 'usr-1',
            usuarioNombre: d.usuarioNombre || 'Dip. Ruben Roque',
            usuarioFoto: d.usuarioFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            usuarioCargo: d.usuarioCargo || 'Diputado Local (Titular)',
            usuarioWhatsapp: d.usuarioWhatsapp || '993 111 2233',
            prioridad: d.prioridad as any || 'Media',
            estatus: d.estatus as any || 'Pendiente',
            fechaLimite: d.fechaLimite,
            horaLimite: d.horaLimite,
            moduloRelacionado: d.moduloRelacionado || 'Gestiones',
            fechaCreacion: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '2026-09-03',
            observaciones: [],
          }));
          setTareas(mapped);
        }
      } catch (err) {
        console.warn('Error loading tareas:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  const [vistaModo, setVistaModo] = useState<'kanban' | 'lista'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('TODOS');
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');
  const [filtroModulo, setFiltroModulo] = useState('TODOS');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [tareaEnEdicion, setTareaEnEdicion] = useState<TareaDespacho | null>(null);
  const [modalDeleteId, setModalDeleteId] = useState<string | null>(null);
  const [tareaChatSeleccionada, setTareaChatSeleccionada] = useState<TareaDespacho | null>(null);

  // Form states with native Date and Time pickers
  const [formTitulo, setFormTitulo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUsuarioId, setFormUsuarioId] = useState('usr-2');
  const [formPrioridad, setFormPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [formEstatus, setFormEstatus] = useState<EstadoTarea>('Pendiente');
  const [formFechaLimite, setFormFechaLimite] = useState('2026-09-03');
  const [formHoraLimite, setFormHoraLimite] = useState('14:00');
  const [formModulo, setFormModulo] = useState('Gestiones');

  // Usuario Activo en Sesión
  const usuarioActivo = {
    nombre: 'Dip. Ruben Roque',
    cargo: 'Diputado Local (Titular)',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  // Chat in Task state
  const [nuevaObsTexto, setNuevaObsTexto] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tareaChatSeleccionada) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tareaChatSeleccionada?.observaciones]);

  // Filter logic
  const filteredTareas = tareas.filter((t) => {
    const matchesSearch = 
      t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.moduloRelacionado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.observaciones.some(o => o.texto.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesUser = filtroUsuario === 'TODOS' || t.usuarioId === filtroUsuario;
    const matchesPrioridad = filtroPrioridad === 'TODAS' || t.prioridad === filtroPrioridad;
    const matchesModulo = filtroModulo === 'TODOS' || t.moduloRelacionado === filtroModulo;

    return matchesSearch && matchesUser && matchesPrioridad && matchesModulo;
  });

  const handleCambiarEstado = (id: string, nuevoEstado: EstadoTarea) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, estatus: nuevoEstado } : t));
    updateTareaStatus(id, nuevoEstado);
    if (tareaChatSeleccionada && tareaChatSeleccionada.id === id) {
      setTareaChatSeleccionada({ ...tareaChatSeleccionada, estatus: nuevoEstado });
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDropKanban = (e: React.DragEvent, targetEstado: EstadoTarea) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!id) return;
    handleCambiarEstado(id, targetEstado);
    setDraggedTaskId(null);
  };

  const handleOpenCrearModal = () => {
    setTareaEnEdicion(null);
    setFormTitulo('');
    setFormDesc('');
    setFormUsuarioId('usr-2');
    setFormPrioridad('Alta');
    setFormEstatus('Pendiente');
    setFormFechaLimite('2026-09-03');
    setFormHoraLimite('14:00');
    setFormModulo('Gestiones');
    setIsModalCrearOpen(true);
  };

  const handleOpenEditarModal = (t: TareaDespacho) => {
    setTareaEnEdicion(t);
    setFormTitulo(t.titulo);
    setFormDesc(t.descripcion);
    setFormUsuarioId(t.usuarioId);
    setFormPrioridad(t.prioridad);
    setFormEstatus(t.estatus);
    setFormFechaLimite(t.fechaLimite);
    setFormHoraLimite(t.horaLimite);
    setFormModulo(t.moduloRelacionado);
    setIsModalCrearOpen(true);
  };

  const handleGuardarTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      alert('Escribe el título de la tarea.');
      return;
    }

    const responsable = USUARIOS_EQUIPO.find(u => u.id === formUsuarioId) || USUARIOS_EQUIPO[1];

    if (tareaEnEdicion) {
      const actualizadas = tareas.map((t) => {
        if (t.id === tareaEnEdicion.id) {
          return {
            ...t,
            titulo: formTitulo.trim(),
            descripcion: formDesc.trim(),
            usuarioId: responsable.id,
            usuarioNombre: responsable.nombre,
            usuarioFoto: responsable.foto,
            usuarioCargo: responsable.cargo,
            usuarioWhatsapp: responsable.whatsapp,
            prioridad: formPrioridad,
            estatus: formEstatus,
            fechaLimite: formFechaLimite,
            horaLimite: formHoraLimite,
            moduloRelacionado: formModulo,
          };
        }
        return t;
      });
      setTareas(actualizadas);
    } else {
      const nueva: TareaDespacho = {
        id: `tar-${Date.now()}`,
        titulo: formTitulo.trim(),
        descripcion: formDesc.trim(),
        usuarioId: responsable.id,
        usuarioNombre: responsable.nombre,
        usuarioFoto: responsable.foto,
        usuarioCargo: responsable.cargo,
        usuarioWhatsapp: responsable.whatsapp,
        prioridad: formPrioridad,
        estatus: formEstatus,
        fechaLimite: formFechaLimite,
        horaLimite: formHoraLimite,
        moduloRelacionado: formModulo,
        fechaCreacion: new Date().toISOString().split('T')[0],
        observaciones: [
          {
            id: `obs-${Date.now()}`,
            fecha: 'Hoy',
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            autor: 'Despacho Parlamentario',
            texto: 'Tarea creada y asignada al integrante del equipo.',
            esDiputado: false,
          }
        ],
      };
      createTarea({ titulo: nueva.titulo, descripcion: nueva.descripcion, usuarioId: nueva.usuarioId, usuarioNombre: nueva.usuarioNombre, usuarioFoto: nueva.usuarioFoto, usuarioCargo: nueva.usuarioCargo, usuarioWhatsapp: nueva.usuarioWhatsapp, prioridad: nueva.prioridad as any, estatus: nueva.estatus as any, fechaLimite: nueva.fechaLimite, horaLimite: nueva.horaLimite, moduloRelacionado: nueva.moduloRelacionado }).then(res => { if (res.success && res.data) { nueva.id = res.data.id; } });
      setTareas([nueva, ...tareas]);
    }

    setIsModalCrearOpen(false);
  };

  const handleEliminarTarea = (id: string) => {
    setTareas(tareas.filter(t => t.id !== id));
    deleteTarea(id);
    setModalDeleteId(null);
    if (tareaChatSeleccionada && tareaChatSeleccionada.id === id) {
      setTareaChatSeleccionada(null);
    }
  };

  // Add Observation in WhatsApp Chat Style (Active User automatically)
  const handleAgregarObservacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObsTexto.trim() || !tareaChatSeleccionada) return;

    const isDip = usuarioActivo.nombre.includes('Dip. Ruben Roque');

    const nuevaObs: ObservacionTarea = {
      id: `obs-${Date.now()}`,
      fecha: 'Hoy',
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      autor: usuarioActivo.nombre,
      texto: nuevaObsTexto.trim(),
      esDiputado: isDip,
    };

    const updatedTarea: TareaDespacho = {
      ...tareaChatSeleccionada,
      observaciones: [...tareaChatSeleccionada.observaciones, nuevaObs],
    };

    setTareas(tareas.map(t => t.id === tareaChatSeleccionada.id ? updatedTarea : t));
    setTareaChatSeleccionada(updatedTarea);
    setNuevaObsTexto('');
  };

  const handleEliminarObservacion = (obsId: string) => {
    if (!tareaChatSeleccionada) return;
    const updatedTarea: TareaDespacho = {
      ...tareaChatSeleccionada,
      observaciones: tareaChatSeleccionada.observaciones.filter(o => o.id !== obsId),
    };
    setTareas(tareas.map(t => t.id === tareaChatSeleccionada.id ? updatedTarea : t));
    setTareaChatSeleccionada(updatedTarea);
  };

  const getPrioridadBadge = (p: string) => {
    switch (p) {
      case 'Alta':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Media':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-800';
    }
  };

  const getAutorChatColor = (autor: string) => {
    if (autor.includes('Dip. Ruben Roque')) return 'text-emerald-700';
    if (autor.includes('Mariana')) return 'text-indigo-700';
    if (autor.includes('Roberto')) return 'text-blue-700';
    if (autor.includes('Carlos')) return 'text-amber-700';
    if (autor.includes('Paulina')) return 'text-purple-700';
    return 'text-gray-700 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={handleOpenCrearModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Total Tareas</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tareas.length}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">Asignadas al equipo</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pendientes</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{tareas.filter(t => t.estatus === 'Pendiente').length}</p>
          <span className="text-[10px] text-amber-600/80 block mt-0.5">Por iniciar</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">En Proceso / Revisión</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{tareas.filter(t => t.estatus === 'En Proceso' || t.estatus === 'En Revisión').length}</p>
          <span className="text-[10px] text-blue-600/80 block mt-0.5">En ejecución</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Completadas</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{tareas.filter(t => t.estatus === 'Completada').length}</p>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            {tareas.length > 0 ? `${Math.round((tareas.filter(t => t.estatus === 'Completada').length / tareas.length) * 100)}% avance` : '0%'}
          </span>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setVistaModo('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Tablero Kanban</span>
            </button>
            <button
              onClick={() => setVistaModo('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'lista'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Lista / Tabla</span>
            </button>
          </div>

          <select
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">👤 Todos los Integrantes</option>
            {USUARIOS_EQUIPO.map((u) => (
              <option key={u.id} value={u.id}>👤 {u.nombre}</option>
            ))}
          </select>

          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas las Prioridades</option>
            <option value="Alta">Alta Prioridad</option>
            <option value="Media">Media Prioridad</option>
            <option value="Baja">Baja Prioridad</option>
          </select>

          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los Módulos</option>
            {MODULOS_SISTEMA_LIST.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tarea, responsable u observaciones..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
          />
        </div>
      </div>

      {/* 1. VISTA TABLERO KANBAN DE TAREAS */}
      {vistaModo === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-start">
          {ESTADOS_KANBAN_TAREAS.map((columnaEstado) => {
            const tareasEnColumna = filteredTareas.filter(t => t.estatus === columnaEstado);

            return (
              <div
                key={columnaEstado}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropKanban(e, columnaEstado)}
                className="bg-gray-100 dark:bg-gray-800/70 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 min-h-[580px] flex flex-col space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      columnaEstado === 'Pendiente' ? 'bg-amber-500' :
                      columnaEstado === 'En Proceso' ? 'bg-blue-500' :
                      columnaEstado === 'En Revisión' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}></span>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                      {columnaEstado}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                    {tareasEnColumna.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1">
                  {tareasEnColumna.map((tarea) => {
                    const ultimaObs = tarea.observaciones[tarea.observaciones.length - 1];
                    return (
                      <div
                        key={tarea.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tarea.id)}
                        onClick={() => setTareaChatSeleccionada(tarea)}
                        className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPrioridadBadge(tarea.prioridad)}`}>
                            {tarea.prioridad}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                            📅 {tarea.fechaLimite} {tarea.horaLimite}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                          {tarea.titulo}
                        </h4>

                        {tarea.descripcion && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-800/40/70 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                            {tarea.descripcion}
                          </p>
                        )}

                        {/* Última observación en formato de globo WhatsApp */}
                        {ultimaObs && (
                          <div className="p-2 bg-[#d9fdd3]/70 rounded-xl border border-emerald-300/60 text-[10px] space-y-0.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-[#00a884]" />
                                <span>{ultimaObs.autor}:</span>
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">{ultimaObs.hora}</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-100 italic line-clamp-1">&quot;{ultimaObs.texto}&quot;</p>
                          </div>
                        )}

                        {/* Responsable + WhatsApp Link */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tarea.usuarioFoto}
                              alt={tarea.usuarioNombre}
                              className="h-6 w-6 rounded-full object-cover border border-white shadow-2xs shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{tarea.usuarioNombre}</p>
                              <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{tarea.usuarioCargo}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`https://api.whatsapp.com/send?phone=52${tarea.usuarioWhatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${tarea.usuarioNombre}, te consulto sobre la tarea: "${tarea.titulo}" con fecha límite ${tarea.fechaLimite} ${tarea.horaLimite}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-emerald-50 text-[#00a884] hover:bg-emerald-100 transition-colors"
                              title="Dar seguimiento por WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>

                            <button
                              onClick={() => handleOpenEditarModal(tarea)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar tarea"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setModalDeleteId(tarea.id)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Footer: Módulo + Botón de Chat */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pt-0.5">
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">
                            📁 {tarea.moduloRelacionado}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#00a884] font-bold">
                            <MessageCircle className="h-3 w-3" />
                            <span>{tarea.observaciones.length} chat</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {tareasEnColumna.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200/80 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic">
                      Arrastra una tarea aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VISTA TABLA / LISTA DE TAREAS */}
      {vistaModo === 'lista' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-10">Estado</th>
                  <th className="py-3.5 px-4">Tarea & Descripción</th>
                  <th className="py-3.5 px-4">Responsable</th>
                  <th className="py-3.5 px-4">Módulo</th>
                  <th className="py-3.5 px-4">Prioridad</th>
                  <th className="py-3.5 px-4">Fecha / Hora Límite</th>
                  <th className="py-3.5 px-4">Chat / Observaciones</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200">
                {filteredTareas.map((tarea) => {
                  const isDone = tarea.estatus === 'Completada';
                  const ultimaObs = tarea.observaciones[tarea.observaciones.length - 1];
                  return (
                    <tr 
                      key={tarea.id} 
                      onClick={() => setTareaChatSeleccionada(tarea)}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(tarea.id, isDone ? 'Pendiente' : 'Completada')}
                          className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className={`font-bold text-gray-900 dark:text-white ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                          {tarea.titulo}
                        </p>
                        {tarea.descripcion && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{tarea.descripcion}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tarea.usuarioFoto}
                            alt={tarea.usuarioNombre}
                            className="h-7 w-7 rounded-full object-cover border border-white shadow-2xs shrink-0"
                          />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">{tarea.usuarioNombre}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{tarea.usuarioCargo}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">
                          {tarea.moduloRelacionado}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPrioridadBadge(tarea.prioridad)}`}>
                          {tarea.prioridad}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        {tarea.fechaLimite} a las {tarea.horaLimite}
                      </td>

                      <td className="py-3 px-4 max-w-[180px]">
                        {ultimaObs ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-[#00a884] text-[10px] font-bold border border-emerald-200">
                                <MessageCircle className="h-2.5 w-2.5" />
                                <span>{tarea.observaciones.length}</span>
                              </span>
                              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{ultimaObs.autor}:</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">&quot;{ultimaObs.texto}&quot;</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-[11px] italic">Sin notas</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`https://api.whatsapp.com/send?phone=52${tarea.usuarioWhatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${tarea.usuarioNombre}, te consulto sobre la tarea: "${tarea.titulo}" con fecha límite ${tarea.fechaLimite} ${tarea.horaLimite}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-[#00a884] hover:bg-emerald-100 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>

                          <button
                            onClick={() => handleOpenEditarModal(tarea)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setModalDeleteId(tarea.id)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NUEVA / EDITAR TAREA CON SELECTORES DE FECHA Y HORA */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                {tareaEnEdicion ? 'Editar Tarea del Equipo' : 'Asignar Nueva Tarea'}
              </h3>
              <button onClick={() => setIsModalCrearOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarTarea} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Título de la Tarea <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej: Elaborar dictamen de comisiones unidas..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Integrante Responsable <span className="text-red-500">*</span></label>
                <select
                  value={formUsuarioId}
                  onChange={(e) => setFormUsuarioId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-semibold"
                >
                  {USUARIOS_EQUIPO.map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.nombre} — ({u.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Prioridad</label>
                  <select
                    value={formPrioridad}
                    onChange={(e) => setFormPrioridad(e.target.value as any)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Estado</label>
                  <select
                    value={formEstatus}
                    onChange={(e) => setFormEstatus(e.target.value as any)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-semibold"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Módulo</label>
                  <select
                    value={formModulo}
                    onChange={(e) => setFormModulo(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                  >
                    {MODULOS_SISTEMA_LIST.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selectores Nativos de Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>Selector de Fecha Límite <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    required
                    type="date"
                    value={formFechaLimite}
                    onChange={(e) => setFormFechaLimite(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Selector de Hora Límite <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    required
                    type="time"
                    value={formHoraLimite}
                    onChange={(e) => setFormHoraLimite(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Instrucciones y Requisitos de Entrega</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detalles de la tarea, antecedentes, requerimientos y entregables..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="px-3.5 py-2 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {tareaEnEdicion ? 'Guardar Cambios' : 'Asignar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALLE DE TAREA & CHAT DE OBSERVACIONES ESTILO WHATSAPP */}
      {tareaChatSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-2xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPrioridadBadge(tareaChatSeleccionada.prioridad)}`}>
                  {tareaChatSeleccionada.prioridad}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  📁 {tareaChatSeleccionada.moduloRelacionado}
                </span>
              </div>
              <button onClick={() => setTareaChatSeleccionada(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            {/* Header de la Tarea & Responsable */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {tareaChatSeleccionada.titulo}
              </h2>
              {tareaChatSeleccionada.descripcion && (
                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 leading-relaxed">
                  {tareaChatSeleccionada.descripcion}
                </p>
              )}

              {/* Responsable + Status Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-gray-200/80 dark:border-gray-800/80">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tareaChatSeleccionada.usuarioFoto}
                    alt={tareaChatSeleccionada.usuarioNombre}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{tareaChatSeleccionada.usuarioNombre}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{tareaChatSeleccionada.usuarioCargo}</p>
                    <p className="text-[10px] text-blue-700 font-mono mt-0.5">
                      📅 Límite: {tareaChatSeleccionada.fechaLimite} a las {tareaChatSeleccionada.horaLimite}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={tareaChatSeleccionada.estatus}
                    onChange={(e) => handleCambiarEstado(tareaChatSeleccionada.id, e.target.value as EstadoTarea)}
                    className="text-xs font-bold bg-white border border-gray-200/80 dark:border-gray-800 rounded-xl px-2.5 py-1.5 text-gray-800 dark:text-gray-100 shadow-2xs"
                  >
                    {ESTADOS_KANBAN_TAREAS.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>

                  <a
                    href={`https://api.whatsapp.com/send?phone=52${tareaChatSeleccionada.usuarioWhatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${tareaChatSeleccionada.usuarioNombre}, te consulto sobre la tarea: "${tareaChatSeleccionada.titulo}".`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* SECCIÓN: CHAT DE OBSERVACIONES ESTILO WHATSAPP */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>Chat de Observaciones y Avance</span>
                      <span className="text-[10px] font-bold text-[#00a884] bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        {tareaChatSeleccionada.observaciones.length} mensajes
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Historial interno de seguimiento de la tarea</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">WhatsApp Style</span>
              </div>

              {/* Chat Feed */}
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#efeae2]/60 dark:bg-gray-900/90 overflow-hidden shadow-inner flex flex-col">
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto min-h-[160px]">
                  {tareaChatSeleccionada.observaciones.length > 0 ? (
                    tareaChatSeleccionada.observaciones.map((obs) => {
                      const isDip = obs.autor.includes('Dip. Ruben Roque');
                      return (
                        <div
                          key={obs.id}
                          className={`flex flex-col ${isDip ? 'items-end' : 'items-start'} group`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl shadow-xs relative space-y-1 ${
                              isDip
                                ? 'bg-[#d9fdd3] rounded-tr-xs border border-[#c1f5b8]'
                                : 'bg-white dark:bg-gray-800 rounded-tl-xs border border-gray-200/80 dark:border-gray-700/80 border-gray-200/80 dark:border-gray-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                              <span className={`font-bold ${getAutorChatColor(obs.autor)}`}>
                                {obs.autor} {isDip ? '👑' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEliminarObservacion(obs.id)}
                                title="Eliminar observación"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            <p className="text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap font-sans">
                              {obs.texto}
                            </p>

                            <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono pt-0.5">
                              <span>{obs.fecha} • {obs.hora}</span>
                              <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic gap-1">
                      <MessageCircle className="h-6 w-6 text-slate-300" />
                      <span>No hay observaciones registradas aún. Escribe la primera nota abajo.</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar (Usuario Activo) */}
                <form onSubmit={handleAgregarObservacion} className="p-2.5 bg-[#f0f2f5] dark:bg-[#1a2234] border-t border-gray-200/80 dark:border-gray-800 border-gray-200/80 dark:border-gray-800/80 flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-gray-200/80 dark:border-gray-800 shrink-0 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={usuarioActivo.foto}
                      alt={usuarioActivo.nombre}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">{usuarioActivo.nombre}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </div>

                  <div className="flex-1 flex items-center gap-2 w-full">
                    <input
                      type="text"
                      required
                      value={nuevaObsTexto}
                      onChange={(e) => setNuevaObsTexto(e.target.value)}
                      placeholder={`Escribir observación como ${usuarioActivo.nombre}...`}
                      className="flex-1 py-2 px-4 text-xs bg-white border border-gray-300 dark:border-gray-700 rounded-full text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] shadow-2xs"
                    />
                    <button
                      type="submit"
                      title="Enviar observación al chat"
                      className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setTareaChatSeleccionada(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-sm w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar Tarea?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Esta acción removerá la tarea permanentemente del seguimiento del equipo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setModalDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarTarea(modalDeleteId)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}