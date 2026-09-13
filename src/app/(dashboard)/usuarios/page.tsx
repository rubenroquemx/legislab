'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  UserCheck, 
  Sparkles, 
  LayoutGrid, 
  LayoutList, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Calendar, 
  FolderKanban, 
  FileText, 
  Mic, 
  Newspaper, 
  Radio, 
  Settings, 
  Copy, 
  Share2, 
  RefreshCw 
} from 'lucide-react';
import { 
  getOfficeUsersAction, 
  inviteOfficeUserAction, 
  updateUserPermissionsAction, 
  deleteOrRevokeUserAction 
} from '@/app/actions/usuarios';
import { PLAN_CONFIGS } from '@/lib/saas-config';

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
  estatus: 'Activo' | 'Invitado' | 'Inactivo';
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDespacho[]>([]);
  const [cargosLista, setCargosLista] = useState<string[]>(CARGOS_PREDETERMINADOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [vistaModo, setVistaModo] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);

  // Quota & Plan State
  const [planQuota, setPlanQuota] = useState<{ current: number; max: number; planName: string }>({
    current: 1,
    max: 2,
    planName: 'Starter',
  });

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<UsuarioDespacho | null>(null);
  const [modalDeleteId, setModalDeleteId] = useState<string | null>(null);

  // Activation Link Modal
  const [isModalLinkOpen, setIsModalLinkOpen] = useState(false);
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    name: string;
    email: string;
    cargo: string;
    url: string;
  } | null>(null);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCargo, setFormCargo] = useState('Asesora Jurídica y Parlamentaria');
  const [isCustomCargo, setIsCustomCargo] = useState(false);
  const [customCargoInput, setCustomCargoInput] = useState('');
  const [formRolNivel, setFormRolNivel] = useState<'Administrador' | 'Asesor' | 'Secretario' | 'Operativo'>('Asesor');
  const [formEstatus, setFormEstatus] = useState<'Activo' | 'Invitado' | 'Inactivo'>('Activo');
  const [formPermisos, setFormPermisos] = useState<Record<string, PermisoAcciones>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await getOfficeUsersAction();
      if (res.success && res.users) {
        const mapped: UsuarioDespacho[] = res.users.map((u: any) => {
          let userPerms = PERMISOS_ADMIN_TOTAL;
          if (u.permissions) {
            try {
              userPerms = JSON.parse(u.permissions);
            } catch (e) {}
          }

          let rolNivel: 'Administrador' | 'Asesor' | 'Secretario' | 'Operativo' = 'Asesor';
          if (u.role === 'diputado' || u.role === 'admin') rolNivel = 'Administrador';
          else if (u.role === 'secretario_tecnico') rolNivel = 'Secretario';
          else if (u.role === 'coordinador_territorial') rolNivel = 'Operativo';

          let estatusFormatted: 'Activo' | 'Invitado' | 'Inactivo' = 'Activo';
          if (u.status === 'invited') estatusFormatted = 'Invitado';
          else if (u.status === 'suspended') estatusFormatted = 'Inactivo';

          return {
            id: u.id,
            nombre: u.name || 'Sin Nombre',
            correo: u.email,
            whatsapp: u.phone || 'Sin WhatsApp',
            fotografia: u.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            cargo: u.cargo || 'Integrante',
            rolNivel,
            estatus: estatusFormatted,
            departamento: 'Despacho Parlamentario',
            fechaIngreso: new Date(u.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
            permisos: userPerms,
          };
        });

        setUsuarios(mapped);

        const planKey = (res.office?.plan || 'starter');
        const planConf = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.starter;
        setPlanQuota({
          current: res.currentCount || mapped.length,
          max: res.maxUsers || planConf.maxUsers || 2,
          planName: planConf.name || 'Starter',
        });
      }
    } catch (err) {
      console.warn('Error loading office users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.whatsapp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstatus = filtroEstatus === 'Todos' || u.estatus === filtroEstatus;
    return matchesSearch && matchesEstatus;
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
    if (planQuota.current >= planQuota.max) {
      alert(`Has alcanzado el límite de ${planQuota.max} usuarios permitidos en tu Plan ${planQuota.planName}. Contacta al Superadmin para ampliar tu cupo.`);
      return;
    }

    setUsuarioEnEdicion(null);
    setFormNombre('');
    setFormCorreo('');
    setFormWhatsapp('');
    setFormCargo(cargosLista[1] || 'Asesora Jurídica y Parlamentaria');
    setIsCustomCargo(false);
    setCustomCargoInput('');
    setFormRolNivel('Asesor');
    setFormEstatus('Activo');
    setFormPermisos(getPermisosInicialesParaRol('Asesor'));
    setIsModalOpen(true);
  };

  const handleOpenEditarModal = (u: UsuarioDespacho) => {
    setUsuarioEnEdicion(u);
    setFormNombre(u.nombre);
    setFormCorreo(u.correo);
    setFormWhatsapp(u.whatsapp);
    setFormCargo(u.cargo);
    setIsCustomCargo(false);
    setCustomCargoInput('');
    setFormRolNivel(u.rolNivel);
    setFormEstatus(u.estatus);
    const permisosCompletos: Record<string, PermisoAcciones> = {};
    MODULOS_SISTEMA.forEach(m => {
      permisosCompletos[m.key] = u.permisos[m.key] || { ver: false, crear: false, editar: false, eliminar: false };
    });
    setFormPermisos(permisosCompletos);
    setIsModalOpen(true);
  };

  const handleToggleAccion = (moduloKey: string, accion: keyof PermisoAcciones) => {
    const actual = formPermisos[moduloKey] || { ver: false, crear: false, editar: false, eliminar: false };
    const nuevoValor = !actual[accion];
    
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

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formCorreo.trim()) {
      alert('Por favor completa el Nombre y el Correo electrónico.');
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

    setIsSubmitting(true);
    try {
      if (usuarioEnEdicion) {
        let dbRole = 'asesor_a';
        if (formRolNivel === 'Administrador') dbRole = 'admin';
        else if (formRolNivel === 'Secretario') dbRole = 'secretario_tecnico';
        else if (formRolNivel === 'Operativo') dbRole = 'coordinador_territorial';

        const res = await updateUserPermissionsAction(usuarioEnEdicion.id, {
          cargo: finalCargo,
          role: dbRole,
          permissions: formPermisos,
          status: formEstatus === 'Inactivo' ? 'suspended' : 'active',
        });

        if (res.success) {
          setIsModalOpen(false);
          await loadUsers();
        } else {
          alert(res.error || 'Error al actualizar usuario');
        }
      } else {
        let dbRole: any = 'asesor_a';
        if (formRolNivel === 'Administrador') dbRole = 'admin';
        else if (formRolNivel === 'Secretario') dbRole = 'secretario_tecnico';
        else if (formRolNivel === 'Operativo') dbRole = 'coordinador_territorial';

        const res = await inviteOfficeUserAction({
          name: formNombre.trim(),
          email: formCorreo.trim(),
          cargo: finalCargo,
          role: dbRole,
          phone: formWhatsapp.trim() || undefined,
          permissions: formPermisos,
        });

        if (res.success && res.activationUrl) {
          setIsModalOpen(false);
          const fullUrl = `${window.location.origin}${res.activationUrl}`;
          setGeneratedLinkData({
            name: formNombre.trim(),
            email: formCorreo.trim(),
            cargo: finalCargo,
            url: fullUrl,
          });
          setIsModalLinkOpen(true);
          await loadUsers();
        } else {
          alert(res.error || 'Error al invitar al usuario');
        }
      }
    } catch (err) {
      alert('Ocurrió un error inesperado al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarUsuario = async (id: string) => {
    try {
      const res = await deleteOrRevokeUserAction(id);
      if (res.success) {
        setModalDeleteId(null);
        await loadUsers();
      } else {
        alert(res.error || 'No se pudo eliminar el usuario');
      }
    } catch (e) {
      alert('Error al eliminar usuario');
    }
  };

  const handleCopiarLink = () => {
    if (!generatedLinkData?.url) return;
    navigator.clipboard.writeText(generatedLinkData.url);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const handleCompartirWhatsApp = () => {
    if (!generatedLinkData) return;
    const msg = `¡Hola ${generatedLinkData.name}! Te hemos invitado a formar parte del equipo en LegisLab como *${generatedLinkData.cargo}*.

Activa tu cuenta y define tu contraseña ingresando a este enlace:
${generatedLinkData.url}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Asesor':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Secretario':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getEstatusBadge = (estatus: string) => {
    switch (estatus) {
      case 'Activo':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Invitado':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse';
      default:
        return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Plan Quota & Action Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Equipo del Despacho Parlamentario</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Plan {planQuota.planName}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Cupo disponible: <strong className="text-white">{planQuota.current} de {planQuota.max} usuarios</strong> ({Math.max(0, planQuota.max - planQuota.current)} libres)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadUsers}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700 cursor-pointer"
            title="Refrescar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCrearModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Invitar Usuario</span>
          </button>
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
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Activo">Activos</option>
            <option value="Invitado">Invitación Pendiente</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono..."
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
              className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-zinc-700">
                    {usuario.nombre[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRolBadge(usuario.rolNivel)}`}>
                        {usuario.rolNivel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getEstatusBadge(usuario.estatus)}`}>
                        {usuario.estatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mt-1">
                      {usuario.nombre}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                      {usuario.cargo}
                    </p>
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{usuario.correo}</span>
                  </div>
                  {usuario.whatsapp && usuario.whatsapp !== 'Sin WhatsApp' && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-mono text-[11px]">{usuario.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Ingreso: {usuario.fechaIngreso}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditarModal(usuario)}
                    className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Editar Permisos"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {usuario.cargo !== 'Diputado Local (Titular)' && (
                    <button
                      onClick={() => setModalDeleteId(usuario.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Eliminar Usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. VISTA TABLA */}
      {vistaModo === 'table' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase">
              <tr>
                <th className="pb-3">Usuario</th>
                <th className="pb-3">Rol / Cargo</th>
                <th className="pb-3">Estatus</th>
                <th className="pb-3">Contacto</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                  <td className="py-3">
                    <div className="font-bold text-gray-900 dark:text-white">{usuario.nombre}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{usuario.correo}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRolBadge(usuario.rolNivel)}`}>
                      {usuario.cargo}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getEstatusBadge(usuario.estatus)}`}>
                      {usuario.estatus}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-[11px] font-mono text-gray-600 dark:text-gray-300">{usuario.whatsapp}</div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditarModal(usuario)}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {usuario.cargo !== 'Diputado Local (Titular)' && (
                        <button
                          onClick={() => setModalDeleteId(usuario.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL INVITAR / EDITAR USUARIO */}
      {isModalOpen && usuarioEnEdicion && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {usuarioEnEdicion ? 'Editar Integrante y Permisos' : 'Invitar Nuevo Integrante'}
                </h2>
                <p className="text-xs text-gray-500">
                  {usuarioEnEdicion ? 'Ajusta los accesos y roles del usuario' : 'Se generará un link de activación para que configure su contraseña'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Lic. Claudia Morales"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    disabled={!!usuarioEnEdicion}
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="usuario@congresotabasco.gob.mx"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Cargo / Responsabilidad</label>
                  <select
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {cargosLista.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">Nivel de Acceso Base</label>
                  <select
                    value={formRolNivel}
                    onChange={(e) => {
                      const nuevoRol = e.target.value as any;
                      setFormRolNivel(nuevoRol);
                      setFormPermisos(getPermisosInicialesParaRol(nuevoRol));
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="Administrador">Administrador (Acceso Total)</option>
                    <option value="Asesor">Asesor Legislativo (Crear / Editar proyectos)</option>
                    <option value="Secretario">Secretario Técnico (Gestión y Agenda)</option>
                    <option value="Operativo">Operativo (Solo lectura y territorio)</option>
                  </select>
                </div>
              </div>

              {/* Matriz Granular de Permisos */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Matriz de Permisos por Módulo</span>
                  </h3>
                  <span className="text-[10px] text-gray-400">Ajuste fino de privilegios</span>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {MODULOS_SISTEMA.map((m) => {
                    const perm = formPermisos[m.key] || { ver: false, crear: false, editar: false, eliminar: false };
                    return (
                      <div key={m.key} className="p-2.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{m.nombre}</div>
                          <div className="text-[10px] text-gray-400">{m.desc}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {(['ver', 'crear', 'editar', 'eliminar'] as const).map((accion) => (
                            <label key={accion} className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perm[accion]}
                                onChange={() => handleToggleAccion(m.key, accion)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="capitalize">{accion}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : usuarioEnEdicion ? 'Guardar Cambios' : 'Generar Invitación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LINK DE ACTIVACIÓN GENERADO */}
      {isModalLinkOpen && generatedLinkData && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">¡Invitación Creada con Éxito!</h2>
              <p className="text-xs text-gray-500 mt-1">
                Comparte este enlace con <strong className="text-gray-800 dark:text-gray-200">{generatedLinkData.name}</strong> para que active su cuenta y defina su contraseña:
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-left">
              <span className="text-[10px] font-bold text-gray-400 block mb-1">Enlace de Activación (Válido por 7 días):</span>
              <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 break-all select-all">
                {generatedLinkData.url}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleCopiarLink}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {copiadoLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoLink ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace'}</span>
              </button>

              <button
                onClick={handleCompartirWhatsApp}
                className="inline-flex items-center justify-center gap-2 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={() => setIsModalLinkOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 py-1.5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR USUARIO */}
      {modalDeleteId && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200 dark:border-gray-800 max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">¿Eliminar este integrante?</h3>
              <p className="text-xs text-gray-500 mt-1">El usuario perderá inmediatamente el acceso al sistema y a los datos del despacho.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setModalDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarUsuario(modalDeleteId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-sm cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
