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
  Smartphone
} from 'lucide-react';
import Link from 'next/link';
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Desktop Sidebar Collapse Toggle + Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 max-w-md w-full">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar en el despacho o teclear comando..."
            className="w-full pl-8 pr-12 py-1.5 text-xs bg-zinc-50 border border-zinc-200/80 rounded-lg focus:outline-none focus:border-zinc-400 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1 py-0.2 rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User (Redactar button removed) */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        
        {/* NOTIFICATIONS BELL BUTTON */}
        <div className="relative" ref={popoverRef}>
          <button 
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative p-1.5 rounded-lg transition-colors",
              notificationsOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
            title="Notificaciones Push"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* NOTIFICATIONS POPOVER */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-900">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-zinc-100 text-zinc-700 rounded">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium"
                >
                  Marcar leídas
                </button>
              </div>

              {/* Push Permission Banner */}
              <div className={cn(
                "p-3 rounded-xl border text-xs space-y-2",
                permissionState === 'granted'
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-zinc-50 border-zinc-200 text-zinc-800"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Smartphone className="h-4 w-4 text-zinc-600" />
                    <span>Notificaciones Push Web</span>
                  </div>

                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold",
                    permissionState === 'granted'
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-200 text-zinc-700"
                  )}>
                    {permissionState === 'granted' ? '✓ Activas' : 'Inactivas'}
                  </span>
                </div>

                {permissionState !== 'granted' ? (
                  <div>
                    <p className="text-[11px] text-zinc-500 leading-tight mb-2">
                      Recibe alertas en la pantalla de bloqueo de tu iPhone o Android.
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
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
                      className="text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      {testSent ? '✓ Enviada al móvil' : 'Probar Notificación'}
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Items List */}
              <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => setNotificationsOpen(false)}
                    className={cn(
                      "p-2.5 flex items-start gap-2.5 rounded-xl transition-colors text-left group block",
                      !notif.read ? "bg-zinc-50/80 hover:bg-zinc-100/80" : "hover:bg-zinc-50"
                    )}
                  >
                    <div className="p-1.5 rounded-lg bg-white border border-zinc-200 shrink-0 text-zinc-600 mt-0.5">
                      {notif.type === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5 text-green-600" />}
                      {notif.type === 'gestion' && <FolderKanban className="h-3.5 w-3.5 text-amber-600" />}
                      {notif.type === 'agenda' && <Calendar className="h-3.5 w-3.5 text-blue-600" />}
                      {notif.type === 'cumpleanos' && <Cake className="h-3.5 w-3.5 text-pink-600" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{notif.title}</p>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{notif.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Dip. Ruben Roque"
            className="h-7 w-7 rounded-full object-cover border border-zinc-200"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-zinc-900 leading-tight">Dip. Ruben Roque</p>
            <p className="text-[10px] text-zinc-400 leading-tight">Distrito 04 Federal</p>
          </div>
        </div>
      </div>
    </header>
  );
}