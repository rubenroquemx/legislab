'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  PanelLeft,
  MessageSquare, 
  FolderKanban, 
  Calendar, 
  Cake,
  Smartphone,
  Building2,
  ChevronDown,
  Check,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getActiveOfficeInfoAction, setActiveOfficeAction } from '@/lib/session-office';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'whatsapp' | 'gestion' | 'agenda' | 'cumpleanos';
  read: boolean;
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Nuevo Mensaje en Atención Ciudadana',
    desc: 'Martha Domínguez: "Buenas tardes Diputado, le escribo para darle seguimiento..."',
    time: 'Hace 4 min',
    type: 'whatsapp',
    read: false,
    link: '/atencion-ciudadana'
  },
  {
    id: 'notif-2',
    title: 'Nueva Gestión Asignada',
    desc: 'Folio GES-2026-092 asignado a Lic. Paulina Rovirosa (Apoyo Médico).',
    time: 'Hace 22 min',
    type: 'gestion',
    read: false,
    link: '/gestiones'
  },
  {
    id: 'notif-3',
    title: 'Recordatorio de Agenda en 15 min',
    desc: '61. Comisión Ordinaria de Gobernación y Puntos Constitucionales.',
    time: 'Hace 45 min',
    type: 'agenda',
    read: true,
    link: '/agenda'
  },
  {
    id: 'notif-4',
    title: 'Cumpleaños de Contacto Clave',
    desc: 'Hoy cumple años la Dra. Patricia Oramas Palma (Secretaria de Salud).',
    time: 'Hoy, 08:00 AM',
    type: 'cumpleanos',
    read: true,
    link: '/dashboard'
  }
];

export function Navbar({ onOpenMobileMenu, onToggleSidebarCollapse, isSidebarCollapsed }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Active Office state
  const [activeOffice, setActiveOffice] = useState<any>(null);
  const [allOffices, setAllOffices] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [officeDropdownOpen, setOfficeDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [switchingOffice, setSwitchingOffice] = useState(false);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const officeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Load Active Office Info
  async function loadOfficeInfo() {
    try {
      const res = await getActiveOfficeInfoAction();
      if (res.success) {
        setActiveOffice(res.activeOffice);
        setIsSuperAdmin(res.isSuperAdmin);
        setAllOffices(res.allOffices || []);
      }
    } catch (e) {
      console.warn('Error loading active office info:', e);
    }
  }

  useEffect(() => {
    loadOfficeInfo();
  }, [session]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (officeDropdownRef.current && !officeDropdownRef.current.contains(target)) {
        setOfficeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOffice = async (officeId: string) => {
    if (activeOffice?.id === officeId) {
      setOfficeDropdownOpen(false);
      return;
    }
    setSwitchingOffice(true);
    try {
      await setActiveOfficeAction(officeId);
      setOfficeDropdownOpen(false);
      window.location.reload();
    } catch (e) {
      console.error('Error switching office:', e);
      setSwitchingOffice(false);
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          handleSendTestNotification('¡Notificaciones Push Activadas!', 'Ahora recibirás alertas de mensajes de WhatsApp, tareas y recordatorios de agenda.');
        }
      } catch (err) {
        console.error('Error al solicitar permiso de notificaciones:', err);
      }
    }
  };

  const handleSendTestNotification = (customTitle?: string, customBody?: string) => {
    const title = customTitle || '🏛️ LegisLab: Nueva Alerta Parlamentaria';
    const body = customBody || 'Nuevo mensaje en Atención Ciudadana de Martha Elena Domínguez (Tamulté).';

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: body,
          icon: '/icons/icon.svg',
          badge: '/icons/icon.svg',
          data: { url: '/atencion-ciudadana' }
        } as any);
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      handleRequestPermission();
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const user = session?.user;
  const userName = user?.name || activeOffice?.titularName || 'Usuario';
  const userCargo = user?.cargo || (user?.isSuperAdmin ? 'Super Administrador SaaS' : 'Integrante de Despacho');

  return (
    <header className="h-14 bg-white/90 backdrop-blur-2xl border-b border-[#E2E8F0] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Sidebar Collapse & Active Office Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9] rounded-xl transition-all duration-120 ios-press cursor-pointer"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5 stroke-[2]" />
        </button>

        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex p-2 text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9] rounded-xl transition-all duration-120 ios-press cursor-pointer"
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* OFFICE SWITCHER (FOR SUPERADMIN) OR OFFICE BADGE (FOR MEMBERS) */}
        <div className="relative" ref={officeDropdownRef}>
          {isSuperAdmin && allOffices.length > 0 ? (
            <button
              type="button"
              onClick={() => setOfficeDropdownOpen(!officeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F5F9] hover:bg-[#E8ECF2] text-[#0B172D] rounded-xl border border-[#E2E8F0] transition-all duration-120 shadow-2xs ios-press group max-w-[220px] sm:max-w-xs truncate cursor-pointer"
              title="Cambiar despacho activo"
            >
              <Building2 className="w-3.5 h-3.5 text-[#1B62E3] shrink-0" />
              <span className="truncate">{activeOffice?.name || 'Seleccionar Despacho'}</span>
              <ChevronDown className="w-3 h-3 text-[#68768A] group-hover:text-[#0B172D] shrink-0" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F5F9] text-[#0B172D] rounded-xl border border-[#E2E8F0] max-w-[240px] truncate">
              <Building2 className="w-3.5 h-3.5 text-[#68768A] shrink-0" />
              <span className="truncate">{activeOffice?.name || 'Despacho Parlamentario'}</span>
            </div>
          )}

          {/* OFFICE SWITCHER DROPDOWN */}
          {officeDropdownOpen && isSuperAdmin && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#F0F2F5] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0B172D]">Despachos Registrados</p>
                  <p className="text-[10px] text-[#68768A]">Modo Superadmin Multi-tenant</p>
                </div>
                <Link
                  href="/admin/despachos"
                  onClick={() => setOfficeDropdownOpen(false)}
                  className="text-[10px] font-semibold text-[#1B62E3] hover:underline"
                >
                  Gestionar todos
                </Link>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#F0F2F5] py-1">
                {allOffices.map((off) => {
                  const isCurrent = off.id === activeOffice?.id;
                  return (
                    <button
                      key={off.id}
                      type="button"
                      disabled={switchingOffice}
                      onClick={() => handleSelectOffice(off.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors",
                        isCurrent
                          ? "bg-[#EBF2FC] text-[#0B172D] font-semibold"
                          : "hover:bg-[#F3F5F9] text-[#0B172D]"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs truncate">{off.name}</p>
                        <p className="text-[10px] text-[#68768A] truncate">{off.titularName} • {off.district || off.state}</p>
                      </div>
                      {isCurrent ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#1B62E3] shrink-0 bg-[#EBF2FC] px-1.5 py-0.5 rounded border border-[#1B62E3]/20">
                          <Check className="w-3 h-3" />
                          <span>Activo</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#68768A] uppercase font-mono">{off.plan}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-[#F0F2F5]">
                <Link
                  href="/admin/despachos?action=new"
                  onClick={() => setOfficeDropdownOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#1B62E3] hover:bg-[#EBF2FC] rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Registrar Nuevo Despacho</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-full hidden md:block max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#68768A]" />
          <input
            type="text"
            placeholder="Buscar en el despacho..."
            className="w-full pl-8 pr-10 py-1.5 text-xs bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#1B62E3] focus:bg-white transition-all text-[#0B172D] placeholder:text-[#68768A]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-[#68768A] bg-white border border-[#E2E8F0] px-1.5 py-0.2 rounded-md shadow-2xs">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        
        {/* NOTIFICATIONS BELL BUTTON */}
        <div className="relative" ref={popoverRef}>
          <button 
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative p-2 rounded-xl transition-colors ios-press cursor-pointer",
              notificationsOpen ? "bg-[#EBF2FC] text-[#1B62E3]" : "text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9]"
            )}
            title="Notificaciones Push"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1B62E3] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* NOTIFICATIONS POPOVER */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#0B172D]">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#EBF2FC] text-[#1B62E3] rounded-full">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#1B62E3] hover:underline font-medium"
                >
                  Marcar leídas
                </button>
              </div>

              {/* Push Permission Banner */}
              <div className={cn(
                "p-3 rounded-xl border text-xs space-y-2",
                permissionState === 'granted'
                  ? "bg-[#EBF9EE] border-[#34C759]/30 text-[#1B5E20]"
                  : "bg-[#F3F5F9] border-[#E2E8F0] text-[#0B172D]"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Smartphone className="h-4 w-4 text-[#68768A]" />
                    <span>Notificaciones Push Web</span>
                  </div>

                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold",
                    permissionState === 'granted'
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#E2E8F0] text-[#68768A]"
                  )}>
                    {permissionState === 'granted' ? '✓ Activas' : 'Inactivas'}
                  </span>
                </div>

                {permissionState !== 'granted' ? (
                  <div>
                    <p className="text-[11px] text-[#68768A] leading-tight mb-2">
                      Recibe alertas en la pantalla de bloqueo de tu iPhone o Android.
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="w-full py-1.5 px-3 bg-[#1B62E3] hover:bg-[#1550BA] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      🔔 Activar Notificaciones en este Dispositivo
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-700">Listo para recibir alertas del despacho.</span>
                    <button
                      type="button"
                      onClick={() => handleSendTestNotification()}
                      className="text-[11px] font-bold text-[#1B62E3] hover:underline"
                    >
                      {testSent ? '✓ Enviada al móvil' : 'Probar Notificación'}
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Items List */}
              <div className="divide-y divide-[#F0F2F5] max-h-72 overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => setNotificationsOpen(false)}
                    className={cn(
                      "p-2.5 flex items-start gap-2.5 rounded-xl transition-colors text-left group block",
                      !notif.read ? "bg-[#F3F5F9]/80 hover:bg-[#E8ECF2]" : "hover:bg-[#F3F5F9]"
                    )}
                  >
                    <div className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] shrink-0 text-[#68768A] mt-0.5">
                      {notif.type === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5 text-[#34C759]" />}
                      {notif.type === 'gestion' && <FolderKanban className="h-3.5 w-3.5 text-[#CA7B20]" />}
                      {notif.type === 'agenda' && <Calendar className="h-3.5 w-3.5 text-[#1B62E3]" />}
                      {notif.type === 'cumpleanos' && <Cake className="h-3.5 w-3.5 text-[#CA7B20]" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-[#0B172D] truncate">{notif.title}</p>
                        <span className="text-[10px] text-[#68768A] font-mono shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-[#68768A] line-clamp-2 leading-relaxed">{notif.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0] hover:opacity-80 transition-opacity text-left cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={userName}
              className="h-7 w-7 rounded-full object-cover border border-[#E2E8F0] shrink-0"
            />
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-[#0B172D] leading-tight truncate max-w-[120px]">{userName}</p>
                {user?.isSuperAdmin && (
                  <span className="text-[9px] font-bold bg-[#E8ECF2] text-[#0B172D] px-1 rounded border border-[#0B172D]/20">Super</span>
                )}
              </div>
              <p className="text-[10px] text-[#68768A] leading-tight truncate max-w-[120px]">{userCargo}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-[#68768A] hidden sm:block" />
          </button>

          {/* PROFILE DROPDOWN */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95">
              <div className="border-b border-[#F0F2F5] pb-2.5">
                <p className="text-xs font-bold text-[#0B172D]">{userName}</p>
                <p className="text-[11px] text-[#68768A] truncate">{user?.email || 'usuario@congreso.gob.mx'}</p>
                <p className="text-[10px] text-[#68768A] mt-0.5 font-medium">{activeOffice?.name}</p>
              </div>

              <div className="space-y-1">
                {user?.isSuperAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0B172D] hover:bg-[#EBF2FC] transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#1B62E3] shrink-0" />
                    <span>Consola Superadmin SaaS</span>
                  </Link>
                )}

                <Link
                  href="/configuracion"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#0B172D] hover:bg-[#F3F5F9] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#68768A] shrink-0" />
                  <span>Configuración del Despacho</span>
                </Link>

                <Link
                  href="/usuarios"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#0B172D] hover:bg-[#F3F5F9] transition-colors"
                >
                  <User className="w-4 h-4 text-[#68768A] shrink-0" />
                  <span>Equipo y Usuarios</span>
                </Link>
              </div>

              <div className="border-t border-[#F0F2F5] pt-1.5">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}