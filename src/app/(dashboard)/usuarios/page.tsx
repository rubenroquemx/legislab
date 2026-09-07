'use client';

import { useState, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  MessageCircle, 
  Phone, 
  Shield, 
  Edit, 
  Trash2, 
  Camera, 
  Check, 
  X, 
  UserCheck, 
  Briefcase, 
  Sparkles, 
  Upload, 
  ExternalLink,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Eye,
  FilePlus2,
  FileEdit,
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  Calendar,
  FolderKanban,
  FileText,
  Mic,
  Newspaper,
  Radio,
  Settings
} from 'lucide-react';

export interface PermisoAcciones {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface UsuarioDespacho {
  id: string;
  nombre: string;
  correo: string;
  whatsapp: string;
  fotografia: string;
  cargo: string;
  rolNivel: 'Administrador' | 'Asesor' | 'Secretario' | 'Operativo';
  estatus: 'Activo' | 'Inactivo';
  departamento: string;
  fechaIngreso: string;
  permisos: Record<string, PermisoAcciones>;
}

const CARGOS_PREDETERMINADOS = [
  'Diputado Local (Titular)',
  'Secretaria Técnica del Despacho',
  'Asesora Jurídica y Parlamentaria',
  'Coordinador de Enlace y Territorio',
  'Coordinador de Comunicación Social',
  'Encargada de Gestión Social y Audiencias',
  'Asistente de Oficina Parlamentaria'
];

const MODULOS_SISTEMA = [
  { key: 'Agenda', nombre: 'Agenda Parlamentaria', icon: Calendar, desc: 'Eventos, audiencias y calendario en vivo' },
  { key: 'Gestiones', nombre: 'Gestiones & Archivo', icon: FolderKanban, desc: 'Expedientes ciudadanos, INE y oficios' },
  { key: 'Iniciativas', nombre: 'Iniciativas de Ley', icon: FileText, desc: 'Proyectos de decreto y técnica legislativa' },
  { key: 'Discursos', nombre: 'Discursos de Tribuna', icon: Mic, desc: 'Posicionamientos y oratoria parlamentaria' },
  { key: 'Boletines', nombre: 'Boletines de Prensa', icon: Newspaper, desc: 'Comunicados y notas informativas' },
  { key: 'Medios', nombre: 'Monitoreo de Medios', icon: Radio, desc: 'Radio, prensa y canales de difusión' },
  { key: 'Usuarios', nombre: 'Sistema de Usuarios', icon: Users, desc: 'Integrantes del despacho y accesos' },
  { key: 'Configuración', nombre: 'Configuración', icon: Settings, desc: 'Membretes, Google Drive y sincronización' },
];

const PERMISOS_ADMIN_TOTAL: Record<string, PermisoAcciones> = {
  Agenda: { ver: true, crear: true, editar: true, eliminar: true },
  Gestiones: { ver: true, crear: true, editar: true, eliminar: true },
  Iniciativas: { ver: true, crear: true, editar: true, eliminar: true },
  Discursos: { ver: true, crear: true, editar: true, eliminar: true },
  Boletines: { ver: true, crear: true, editar: true, eliminar: true },
  Medios: { ver: true, crear: true, editar: true, eliminar: true },
  Usuarios: { ver: true, crear: true, editar: true, eliminar: true },
  Configuración: { ver: true, crear: true, editar: true, eliminar: true },
};

const INITIAL_USUARIOS: UsuarioDespacho[] = [
  {
    id: 'usr-1',
    nombre: 'Dip. Ruben Roque',
    correo: 'ruben.roque@congresotabasco.gob.mx',
    whatsapp: '993 111 2233',
    fotografia: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    cargo: 'Diputado Local (Titular)',
    rolNivel: 'Administrador',
    estatus: 'Activo',
    departamento: 'Pleno Legislativo',
    fechaIngreso: '01 Sep 2024',
    permisos: { ...PERMISOS_ADMIN_TOTAL },
  },
  {
    id: 'usr-2',
    nombre: 'Lic. Mariana Soto Gómez',
    correo: 'mariana.soto@despachoroque.mx',
    whatsapp: '993 456 7890',
    fotografia: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    cargo: 'Asesora Jurídica y Parlamentaria',
    rolNivel: 'Asesor',
    estatus: 'Activo',
    departamento: 'Asuntos Jurídicos y Dictaminación',
    fechaIngreso: '05 Sep 2024',
    permisos: {
      Agenda: { ver: true, crear: true, editar: true, eliminar: false },
      Gestiones: { ver: true, crear: true, editar: true, eliminar: false },
      Iniciativas: { ver: true, crear: true, editar: true, eliminar: true },
      Discursos: { ver: true, crear: true, editar: true, eliminar: true },
      Boletines: { ver: true, crear: true, editar: false, eliminar: false },
      Medios: { ver: true, crear: false, editar: false, eliminar: false },
      Usuarios: { ver: true, crear: false, editar: false, eliminar: false },
      Configuración: { ver: true, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: 'usr-3',
    nombre: 'Lic. Roberto Garza Priego',
    correo: 'roberto.garza@despachoroque.mx',
    whatsapp: '993 321 6549',
    fotografia: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    cargo: 'Secretario Técnico del Despacho',
    rolNivel: 'Administrador',
    estatus: 'Activo',
    departamento: 'Secretaría Técnica',
    fechaIngreso: '01 Sep 2024',
    permisos: { ...PERMISOS_ADMIN_TOTAL },
  },
  {
    id: 'usr-4',
    nombre: 'Ing. Carlos Alberto Morales',
    correo: 'carlos.morales@despachoroque.mx',
    whatsapp: '993 789 1234',
    fotografia: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    cargo: 'Coordinador de Enlace y Territorio',
    rolNivel: 'Operativo',
    estatus: 'Activo',
    departamento: 'Atención Ciudadana y Territorio',
    fechaIngreso: '15 Sep 2024',
    permisos: {
      Agenda: { ver: true, crear: true, editar: true, eliminar: false },
      Gestiones: { ver: true, crear: true, editar: true, eliminar: false },
      Iniciativas: { ver: true, crear: false, editar: false, eliminar: false },
      Discursos: { ver: true, crear: false, editar: false, eliminar: false },
      Boletines: { ver: false, crear: false, editar: false, eliminar: false },
      Medios: { ver: false, crear: false, editar: false, eliminar: false },
      Usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      Configuración: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: 'usr-5',
    nombre: 'Lic. Paulina Rovirosa Vega',
    correo: 'prensa.roque@despachoroque.mx',
    whatsapp: '993 888 7766',
    fotografia: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    cargo: 'Coordinador de Comunicación Social',
    rolNivel: 'Asesor',
    estatus: 'Activo',
    departamento: 'Prensa y Medios Digitales',
    fechaIngreso: '01 Oct 2024',
    permisos: {
      Agenda: { ver: true, crear: false, editar: false, eliminar: false },
      Gestiones: { ver: true, crear: false, editar: false, eliminar: false },
      Iniciativas: { ver: true, crear: false, editar: false, eliminar: false },
      Discursos: { ver: true, crear: true, editar: true, eliminar: false },
      Boletines: { ver: true, crear: true, editar: true, eliminar: true },
      Medios: { ver: true, crear: true, editar: true, eliminar: true },
      Usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      Configuración: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: 'usr-6',
    nombre: 'L.A.E. Sofía Méndez Narváez',
    correo: 'atencion.ciudadana@despachoroque.mx',
    whatsapp: '993 999 4455',
    fotografia: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    cargo: 'Encargada de Gestión Social y Audiencias',
    rolNivel: 'Operativo',
    estatus: 'Activo',
    departamento: 'Mesa de Entrada y Gestión',
    fechaIngreso: '10 Oct 2024',
    permisos: {
      Agenda: { ver: true, crear: true, editar: false, eliminar: false },
      Gestiones: { ver: true, crear: true, editar: true, eliminar: false },
      Iniciativas: { ver: false, crear: false, editar: false, eliminar: false },
      Discursos: { ver: false, crear: false, editar: false, eliminar: false },
      Boletines: { ver: false, crear: false, editar: false, eliminar: false },
      Medios: { ver: false, crear: false, editar: false, eliminar: false },
      Usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      Configuración: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDespacho[]>(INITIAL_USUARIOS);
  const [cargosLista, setCargosLista] = useState<string[]>(CARGOS_PREDETERMINADOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [vistaModo, setVistaModo] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<UsuarioDespacho | null>(null);
  const [modalDeleteId, setModalDeleteId] = useState<string | null>(null);
  const [usuarioDetallePermisos, setUsuarioDetallePermisos] = useState<UsuarioDespacho | null>(null);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formFotografia, setFormFotografia] = useState('');
  const [formCargo, setFormCargo] = useState('Asesora Jurídica y Parlamentaria');
  const [isCustomCargo, setIsCustomCargo] = useState(false);
  const [customCargoInput, setCustomCargoInput] = useState('');
  const [formRolNivel, setFormRolNivel] = useState<'Administrador' | 'Asesor' | 'Secretario' | 'Operativo'>('Asesor');
  const [formEstatus, setFormEstatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [formDepartamento, setFormDepartamento] = useState('');
  const [formPermisos, setFormPermisos] = useState<Record<string, PermisoAcciones>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.whatsapp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.departamento.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCargo = filtroCargo === 'Todos' || u.cargo === filtroCargo;
    const matchesEstatus = filtroEstatus === 'Todos' || u.estatus === filtroEstatus;

    return matchesSearch && matchesCargo && matchesEstatus;
  });

  const getPermisosInicialesParaRol = (rol: string): Record<string, PermisoAcciones> => {
    const base: Record<string, PermisoAcciones> = {};
    MODULOS_SISTEMA.forEach(m => {
      if (rol === 'Administrador') {
        base[m.key] = { ver: true, crear: true, editar: true, eliminar: true };
      } else if (rol === 'Asesor') {
        base[m.key] = {
          ver: true,
          crear: ['Iniciativas', 'Discursos', 'Boletines', 'Gestiones', 'Agenda'].includes(m.key),
          editar: ['Iniciativas', 'Discursos', 'Boletines', 'Gestiones'].includes(m.key),
          eliminar: false
        };
      } else if (rol === 'Secretario') {
        base[m.key] = {
          ver: true,
          crear: true,
          editar: true,
          eliminar: ['Iniciativas', 'Discursos', 'Boletines'].includes(m.key)
        };
      } else {
        // Operativo
        base[m.key] = {
          ver: ['Agenda', 'Gestiones'].includes(m.key),
          crear: ['Agenda', 'Gestiones'].includes(m.key),
          editar: ['Gestiones'].includes(m.key),
          eliminar: false
        };
      }
    });
    return base;
  };

  const handleOpenCrearModal = () => {
    setUsuarioEnEdicion(null);
    setFormNombre('');
    setFormCorreo('');
    setFormWhatsapp('');
    setFormFotografia('');
    setFormCargo(cargosLista[0] || 'Asesora Jurídica y Parlamentaria');
    setIsCustomCargo(false);
    setCustomCargoInput('');
    setFormRolNivel('Asesor');
    setFormEstatus('Activo');
    setFormDepartamento('Asesoría Parlamentaria');
    setFormPermisos(getPermisosInicialesParaRol('Asesor'));
    setIsModalOpen(true);
  };

  const handleOpenEditarModal = (u: UsuarioDespacho) => {
    setUsuarioEnEdicion(u);
    setFormNombre(u.nombre);
    setFormCorreo(u.correo);
    setFormWhatsapp(u.whatsapp);
    setFormFotografia(u.fotografia);
    setFormCargo(u.cargo);
    setIsCustomCargo(false);
    setCustomCargoInput('');
    setFormRolNivel(u.rolNivel);
    setFormEstatus(u.estatus);
    setFormDepartamento(u.departamento);
    // Asegurar que todos los módulos existan en los permisos del usuario
    const permisosCompletos: Record<string, PermisoAcciones> = {};
    MODULOS_SISTEMA.forEach(m => {
      permisosCompletos[m.key] = u.permisos[m.key] || { ver: false, crear: false, editar: false, eliminar: false };
    });
    setFormPermisos(permisosCompletos);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFotografia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Granular Permission Toggles
  const handleToggleAccion = (moduloKey: string, accion: keyof PermisoAcciones) => {
    const actual = formPermisos[moduloKey] || { ver: false, crear: false, editar: false, eliminar: false };
    const nuevoValor = !actual[accion];
    
    // Si se activa crear/editar/eliminar, automáticamente se debe activar "ver"
    const nuevoPermiso = {
      ...actual,
      [accion]: nuevoValor,
      ...(nuevoValor && (accion === 'crear' || accion === 'editar' || accion === 'eliminar') ? { ver: true } : {}),
      ...(!nuevoValor && accion === 'ver' ? { crear: false, editar: false, eliminar: false } : {}),
    };

    setFormPermisos({
      ...formPermisos,
      [moduloKey]: nuevoPermiso,
    });
  };

  const handlePresetModulo = (moduloKey: string, tipo: 'ninguno' | 'ver' | 'crear_editar' | 'total') => {
    let nuevoPermiso: PermisoAcciones;
    switch (tipo) {
      case 'ninguno':
        nuevoPermiso = { ver: false, crear: false, editar: false, eliminar: false };
        break;
      case 'ver':
        nuevoPermiso = { ver: true, crear: false, editar: false, eliminar: false };
        break;
      case 'crear_editar':
        nuevoPermiso = { ver: true, crear: true, editar: true, eliminar: false };
        break;
      case 'total':
        nuevoPermiso = { ver: true, crear: true, editar: true, eliminar: true };
        break;
    }

    setFormPermisos({
      ...formPermisos,
      [moduloKey]: nuevoPermiso,
    });
  };

  const handlePresetGlobal = (tipo: 'total' | 'ver_todo' | 'limpiar') => {
    const actualizados: Record<string, PermisoAcciones> = {};
    MODULOS_SISTEMA.forEach(m => {
      if (tipo === 'total') {
        actualizados[m.key] = { ver: true, crear: true, editar: true, eliminar: true };
      } else if (tipo === 'ver_todo') {
        actualizados[m.key] = { ver: true, crear: false, editar: false, eliminar: false };
      } else {
        actualizados[m.key] = { ver: false, crear: false, editar: false, eliminar: false };
      }
    });
    setFormPermisos(actualizados);
  };

  const handleGuardarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formCorreo.trim() || !formWhatsapp.trim()) {
      alert('Por favor completa los campos obligatorios (Nombre, Correo y WhatsApp).');
      return;
    }

    let finalCargo = formCargo;
    if (isCustomCargo) {
      const trimmed = customCargoInput.trim();
      if (!trimmed) {
        alert('Escribe el nombre del nuevo cargo.');
        return;
      }
      finalCargo = trimmed;
      if (!cargosLista.includes(finalCargo)) {
        setCargosLista([...cargosLista, finalCargo]);
      }
    }

    const fotoDefault = formFotografia || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

    if (usuarioEnEdicion) {
      const actualizados = usuarios.map((u) => {
        if (u.id === usuarioEnEdicion.id) {
          return {
            ...u,
            nombre: formNombre.trim(),
            correo: formCorreo.trim(),
            whatsapp: formWhatsapp.trim(),
            fotografia: fotoDefault,
            cargo: finalCargo,
            rolNivel: formRolNivel,
            estatus: formEstatus,
            departamento: formDepartamento.trim() || 'Despacho Parlamentario',
            permisos: formPermisos,
          };
        }
        return u;
      });
      setUsuarios(actualizados);
    } else {
      const nuevoUsuario: UsuarioDespacho = {
        id: `usr-${Date.now()}`,
        nombre: formNombre.trim(),
        correo: formCorreo.trim(),
        whatsapp: formWhatsapp.trim(),
        fotografia: fotoDefault,
        cargo: finalCargo,
        rolNivel: formRolNivel,
        estatus: formEstatus,
        departamento: formDepartamento.trim() || 'Despacho Parlamentario',
        fechaIngreso: 'Hoy',
        permisos: formPermisos,
      };
      setUsuarios([nuevoUsuario, ...usuarios]);
    }

    setIsModalOpen(false);
  };

  const handleEliminarUsuario = (id: string) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
    setModalDeleteId(null);
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Asesor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Secretario':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getResumenPermisoBadge = (p?: PermisoAcciones) => {
    if (!p || (!p.ver && !p.crear && !p.editar && !p.eliminar)) {
      return <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Sin acceso</span>;
    }
    if (p.ver && p.crear && p.editar && p.eliminar) {
      return <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">Total</span>;
    }
    if (p.ver && p.crear && p.editar) {
      return <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Crear/Editar</span>;
    }
    if (p.ver && p.crear) {
      return <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Crear</span>;
    }
    if (p.ver) {
      return <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Solo Ver</span>;
    }
    return null;
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
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Total Integrantes</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usuarios.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Equipo Activo</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Administradores</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{usuarios.filter(u => u.rolNivel === 'Administrador').length}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">Control Total</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Asesores & Técnica</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{usuarios.filter(u => u.rolNivel === 'Asesor' || u.rolNivel === 'Secretario').length}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">Técnica Legislativa</span>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Territorio & Gestión</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{usuarios.filter(u => u.rolNivel === 'Operativo').length}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">Atención Ciudadana</span>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setVistaModo('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setVistaModo('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'table'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Lista / Tabla</span>
            </button>
          </div>

          <select
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos los Cargos</option>
            {cargosLista.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos los Estatus</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo, whatsapp o cargo..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
          />
        </div>
      </div>

      {/* 1. VISTA TARJETAS / GRID */}
      {vistaModo === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                {/* Header: Photo, Name & Badges */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-100 dark:bg-gray-800 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={usuario.fotografia}
                      alt={usuario.nombre}
                      className="h-full w-full object-cover"
                    />
                    <span className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white ${usuario.estatus === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRolBadge(usuario.rolNivel)}`}>
                        {usuario.rolNivel}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setUsuarioDetallePermisos(usuario)}
                          title="Ver matriz de permisos"
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditarModal(usuario)}
                          title="Editar usuario y permisos"
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setModalDeleteId(usuario.id)}
                          title="Eliminar usuario"
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {usuario.nombre}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 truncate flex items-center gap-1">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span>{usuario.cargo}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{usuario.departamento}</p>
                  </div>
                </div>

                {/* Contact Links: Email & WhatsApp */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                  <a
                    href={`mailto:${usuario.correo}`}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors truncate p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="truncate">{usuario.correo}</span>
                  </a>

                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5 text-[#00a884] shrink-0" />
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs">{usuario.whatsapp}</span>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?phone=52${usuario.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${usuario.nombre}, te escribo del Despacho Parlamentario.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-[#00a884] hover:bg-[#008f6f] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Permisos Personalizados por Módulo */}
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Permisos por Módulo
                    </span>
                    <button
                      onClick={() => handleOpenEditarModal(usuario)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Editar Permisos
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MODULOS_SISTEMA.map((m) => {
                      const p = usuario.permisos[m.key];
                      const Icon = m.icon;
                      return (
                        <div
                          key={m.key}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800/80 text-[10px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Icon className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{m.key}</span>
                          </div>
                          {getResumenPermisoBadge(p)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>Ingreso: {usuario.fechaIngreso}</span>
                <span className={`font-bold ${usuario.estatus === 'Activo' ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  ● {usuario.estatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. VISTA TABLA / LISTA */}
      {vistaModo === 'table' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Fotografía & Nombre</th>
                  <th className="py-3.5 px-4">Cargo / Posición</th>
                  <th className="py-3.5 px-4">Correo Institucional</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Resumen Permisos</th>
                  <th className="py-3.5 px-4">Estatus</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200">
                {filteredUsuarios.map((u) => {
                  const modulosConAcceso = MODULOS_SISTEMA.filter(m => u.permisos[m.key]?.ver).length;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200/80 dark:border-gray-800 shrink-0 bg-gray-100 dark:bg-gray-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u.fotografia} alt={u.nombre} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{u.nombre}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{u.departamento}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {u.cargo}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                        <a href={`mailto:${u.correo}`} className="hover:underline hover:text-blue-600">
                          {u.correo}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{u.whatsapp}</span>
                          <a
                            href={`https://api.whatsapp.com/send?phone=52${u.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${u.nombre}, te escribo del Despacho Parlamentario.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-50 text-[#00a884] hover:bg-emerald-100 transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRolBadge(u.rolNivel)}`}>
                          {u.rolNivel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setUsuarioDetallePermisos(u)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span>{modulosConAcceso} / {MODULOS_SISTEMA.length} módulos</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.estatus === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {u.estatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditarModal(u)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario y permisos"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setModalDeleteId(u.id)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
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

      {/* MODAL 1: ALTA Y EDICIÓN DE USUARIO CON MATRIZ DE PERMISOS GRANULARES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-3xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {usuarioEnEdicion ? `Editar Usuario: ${usuarioEnEdicion.nombre}` : 'Nuevo Usuario / Integrante del Despacho'}
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Datos personales, fotografía, cargo oficial y matriz de permisos por módulo.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              {/* Fotografía Upload & Preview */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800">
                <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200 dark:bg-gray-700 relative">
                  {formFotografia ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formFotografia} alt="Vista previa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xl">
                      {formNombre ? formNombre[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 block">Fotografía del Integrante</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                      <span>Subir Foto</span>
                    </button>
                    {formFotografia && (
                      <button
                        type="button"
                        onClick={() => setFormFotografia('')}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Lic. Mariana Soto Gómez"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Cargo / Posición <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={isCustomCargo ? '__OTRO__' : formCargo}
                    onChange={(e) => {
                      if (e.target.value === '__OTRO__') {
                        setIsCustomCargo(true);
                        setCustomCargoInput('');
                      } else {
                        setIsCustomCargo(false);
                        setFormCargo(e.target.value);
                      }
                    }}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {cargosLista.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__OTRO__">✨ + Agregar nuevo cargo...</option>
                  </select>

                  {isCustomCargo && (
                    <input
                      type="text"
                      required
                      value={customCargoInput}
                      onChange={(e) => setCustomCargoInput(e.target.value)}
                      placeholder="Escribe el nombre del nuevo cargo..."
                      className="w-full p-2 text-xs bg-white border border-blue-200 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  )}
                </div>
              </div>

              {/* Correo y WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="mariana.soto@despachoroque.mx"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Teléfono / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="993 456 7890"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
              </div>

              {/* Rol Nivel, Departamento y Estatus */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Nivel de Rol</label>
                  <select
                    value={formRolNivel}
                    onChange={(e) => {
                      const nuevoRol = e.target.value as any;
                      setFormRolNivel(nuevoRol);
                      setFormPermisos(getPermisosInicialesParaRol(nuevoRol));
                    }}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Asesor">Asesor</option>
                    <option value="Secretario">Secretario</option>
                    <option value="Operativo">Operativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Departamento / Área</label>
                  <input
                    type="text"
                    value={formDepartamento}
                    onChange={(e) => setFormDepartamento(e.target.value)}
                    placeholder="Ej: Asuntos Jurídicos"
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Estatus</label>
                  <select
                    value={formEstatus}
                    onChange={(e) => setFormEstatus(e.target.value as any)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* MATRIZ DE PERMISOS GRANULARES PERSONALIZABLES POR MÓDULO */}
              <div className="space-y-3 pt-3 border-t border-gray-200/80 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-blue-600" />
                      <span>Matriz de Permisos Personalizables por Módulo</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Define con precisión si el usuario puede <strong>Ver</strong>, <strong>Crear</strong>, <strong>Editar</strong> o <strong>Eliminar</strong> en cada módulo.
                    </p>
                  </div>

                  {/* Botones de Presets Globales */}
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => handlePresetGlobal('total')}
                      className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                    >
                      👑 Todo Total
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetGlobal('ver_todo')}
                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                    >
                      👁️ Solo Ver Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetGlobal('limpiar')}
                      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      🔒 Sin Acceso
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200/80 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-[10px] uppercase tracking-wider border-b border-gray-200/80 dark:border-gray-800">
                      <tr>
                        <th className="py-2.5 px-3">Módulo</th>
                        <th className="py-2.5 px-2 text-center">Presets Rápidos</th>
                        <th className="py-2.5 px-2 text-center text-blue-700">👁️ Ver</th>
                        <th className="py-2.5 px-2 text-center text-emerald-700">➕ Crear</th>
                        <th className="py-2.5 px-2 text-center text-amber-700">✏️ Editar</th>
                        <th className="py-2.5 px-2 text-center text-red-700">🗑️ Eliminar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white">
                      {MODULOS_SISTEMA.map((m) => {
                        const Icon = m.icon;
                        const p = formPermisos[m.key] || { ver: false, crear: false, editar: false, eliminar: false };
                        return (
                          <tr key={m.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50/70 transition-colors">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{m.nombre}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{m.desc}</p>
                                </div>
                              </div>
                            </td>

                            {/* Preset Buttons per Row */}
                            <td className="py-2 px-2 text-center">
                              <div className="inline-flex items-center gap-1 text-[9px]">
                                <button
                                  type="button"
                                  onClick={() => handlePresetModulo(m.key, 'ninguno')}
                                  title="Sin acceso al módulo"
                                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                >
                                  Off
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresetModulo(m.key, 'ver')}
                                  title="Solo ver"
                                  className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold"
                                >
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresetModulo(m.key, 'crear_editar')}
                                  title="Crear y Editar"
                                  className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold"
                                >
                                  Crear+Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresetModulo(m.key, 'total')}
                                  title="Control total"
                                  className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold"
                                >
                                  Total
                                </button>
                              </div>
                            </td>

                            {/* Checkbox Ver */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={p.ver}
                                onChange={() => handleToggleAccion(m.key, 'ver')}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* Checkbox Crear */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={p.crear}
                                onChange={() => handleToggleAccion(m.key, 'crear')}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>

                            {/* Checkbox Editar */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={p.editar}
                                onChange={() => handleToggleAccion(m.key, 'editar')}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>

                            {/* Checkbox Eliminar */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={p.eliminar}
                                onChange={() => handleToggleAccion(m.key, 'eliminar')}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-red-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {usuarioEnEdicion ? 'Guardar Cambios de Usuario' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VISTA DETALLADA DE MATRIZ DE PERMISOS */}
      {usuarioDetallePermisos && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200/80 dark:border-gray-800 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={usuarioDetallePermisos.fotografia} alt={usuarioDetallePermisos.nombre} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{usuarioDetallePermisos.nombre}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{usuarioDetallePermisos.cargo}</p>
                </div>
              </div>
              <button onClick={() => setUsuarioDetallePermisos(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 block">Matriz de Acceso Asignada:</span>
              <div className="border border-gray-200/80 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 text-[10px] uppercase font-bold border-b border-gray-200/80 dark:border-gray-800">
                    <tr>
                      <th className="p-2.5">Módulo</th>
                      <th className="p-2.5 text-center">Ver</th>
                      <th className="p-2.5 text-center">Crear</th>
                      <th className="p-2.5 text-center">Editar</th>
                      <th className="p-2.5 text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {MODULOS_SISTEMA.map((m) => {
                      const p = usuarioDetallePermisos.permisos[m.key] || { ver: false, crear: false, editar: false, eliminar: false };
                      return (
                        <tr key={m.key}>
                          <td className="p-2.5 font-bold text-gray-800 dark:text-gray-100">{m.nombre}</td>
                          <td className="p-2.5 text-center">{p.ver ? '✅' : '❌'}</td>
                          <td className="p-2.5 text-center">{p.crear ? '✅' : '❌'}</td>
                          <td className="p-2.5 text-center">{p.editar ? '✅' : '❌'}</td>
                          <td className="p-2.5 text-center">{p.eliminar ? '✅' : '❌'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  const u = usuarioDetallePermisos;
                  setUsuarioDetallePermisos(null);
                  handleOpenEditarModal(u);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Modificar Permisos
              </button>
              <button
                onClick={() => setUsuarioDetallePermisos(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                Cerrar
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
              <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar Usuario?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Esta acción removerá el acceso de este integrante al sistema del despacho.
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
                onClick={() => handleEliminarUsuario(modalDeleteId)}
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
