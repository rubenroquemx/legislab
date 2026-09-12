'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard,
  Calendar,
  Contact,
  FolderKanban, 
  CheckSquare,
  Compass,
  FileText, 
  Mic, 
  Newspaper, 
  Scale, 
  Radio, 
  Settings, 
  Users, 
  LogOut, 
  X,
  Menu,
  UsersRound,
  HardDrive,
  MessageSquareText,
  ShieldCheck,
  ChevronRight,
  Search,
  Sparkles,
  Building2,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isNew?: boolean;
  moduleKey?: string;
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    sectionTitle: 'ADMINISTRACIÓN',
    items: [
      { name: 'Escritorio', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Agenda', href: '/agenda', icon: Calendar, moduleKey: 'agenda' },
      { name: 'Directorio', href: '/directorio', icon: Contact, moduleKey: 'directorio' },
      { name: 'Grupos', href: '/grupos', icon: UsersRound, moduleKey: 'grupos' },
      { name: 'Atención ciudadana', href: '/atencion-ciudadana', icon: MessageSquareText, badge: '4', isNew: true, moduleKey: 'atencion_ciudadana' },
      { name: 'Gestiones', href: '/gestiones', icon: FolderKanban, badge: '12', moduleKey: 'gestiones' },
      { name: 'Tareas', href: '/tareas', icon: CheckSquare, badge: '6', moduleKey: 'tareas' },
      { name: 'Gestión territorial', href: '/territorio', icon: Compass, moduleKey: 'territorio' },
    ],
  },
  {
    sectionTitle: 'TRABAJO LEGISLATIVO',
    items: [
      { name: 'Iniciativas', href: '/iniciativas', icon: FileText, moduleKey: 'redactor_ia' },
      { name: 'Discursos', href: '/discursos', icon: Mic, moduleKey: 'redactor_ia' },
      { name: 'Boletines', href: '/boletines', icon: Newspaper, moduleKey: 'redactor_ia' },
      { name: 'Marco Jurídico', href: '/marco-juridico', icon: Scale, moduleKey: 'marco_juridico' },
    ],
  },
  {
    sectionTitle: 'MEDIOS Y COMUNICACIÓN',
    items: [
      { name: 'Monitoreo de medios', href: '/medios', icon: Radio, moduleKey: 'medios' },
    ],
  },
  {
    sectionTitle: 'SISTEMA Y AJUSTES',
    items: [
      { name: 'Ajustes Generales', href: '/configuracion?tab=general', icon: Settings },
      { name: 'Usuarios y equipo', href: '/usuarios', icon: Users },
      { name: 'Conexiones y Cloud', href: '/configuracion?tab=conexiones', icon: HardDrive },
    ],
  },
];

interface MobileFullScreenMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MobileFullScreenMenu({ isOpen, onToggle, onClose }: MobileFullScreenMenuProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [enabledModules, setEnabledModules] = useState<string[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('legislab_enabled_modules');
    if (saved) {
      try {
        setEnabledModules(JSON.parse(saved));
      } catch (e) {
        console.warn('Error parsing enabled modules:', e);
      }
    }
  }, []);

  // Lock body scroll when full-screen menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredSections = navSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      const isEnabled = !item.moduleKey || !enabledModules || enabledModules.includes(item.moduleKey);
      const matchesSearch = searchTerm.trim() === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return isEnabled && matchesSearch;
    })
  })).filter(sec => sec.items.length > 0);

  const user = session?.user;
  const userName = user?.name || 'Diputado Titular';
  const userCargo = user?.cargo || (user?.isSuperAdmin ? 'Super Administrador SaaS' : 'Diputado Titular');

  return (
    <>
      {/* =========================================================================
          1. FLOATING ACTION BUTTON (BOTTOM-RIGHT CORNER)
          Toggles smoothly between Menu (closed) and Close X (open)
         ========================================================================= */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        className={cn(
          "lg:hidden fixed z-50 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 select-none shadow-[0_8px_30px_rgba(0,0,0,0.35)] cursor-pointer",
          "bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-[max(1.25rem,calc(env(safe-area-inset-right)+0.75rem))]",
          "w-14 h-14 rounded-full border-2",
          isOpen 
            ? "bg-red-600 text-white border-white/40 rotate-90" 
            : "bg-[#0B172D] text-white border-white/20 hover:bg-[#1B62E3]"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 stroke-[2.5]" />
        ) : (
          <Menu className="h-6 w-6 stroke-[2.2]" />
        )}
      </button>

      {/* =========================================================================
          2. FULL-SCREEN IMMERSIVE MENU OVERLAY
         ========================================================================= */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-[#F2F2F7] flex flex-col overflow-y-auto animate-in fade-in duration-200"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Menu Top Bar */}
          <div className="pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-3 bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA] sticky top-0 z-20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192.png"
                  alt="LegisLab"
                  className="h-9 w-9 shrink-0 object-contain rounded-[10px] shadow-xs"
                />
                <div>
                  <h1 className="font-bold text-[#0B172D] text-ios-headline tracking-tight">
                    LegisLab
                  </h1>
                  <p className="text-ios-caption2 text-[#8E8E93] font-medium uppercase tracking-wider">
                    Menú Principal
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1B62E3]/10 text-[#1B62E3]">
                iOS Edition
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar módulo o herramienta..."
                className="w-full pl-10 pr-4 py-2 text-ios-subhead bg-[#F2F2F7] border border-[#E5E5EA] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1B62E3] text-[#0B172D] placeholder-[#8E8E93]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] bg-white rounded-full p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* User Profile Card (Inset Grouped) */}
          <div className="px-4 pt-4">
            <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-3.5 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={userName}
                className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-ios-headline font-bold text-[#0B172D] truncate">
                  {userName}
                </h2>
                <p className="text-ios-caption1 text-[#8E8E93] truncate">
                  {userCargo}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="px-4 py-3 space-y-5 flex-1">
            {filteredSections.map((section) => (
              <div key={section.sectionTitle} className="space-y-1.5">
                <h3 className="px-3 text-ios-caption2 font-bold tracking-wider text-[#8E8E93] uppercase">
                  {section.sectionTitle}
                </h3>

                <div className="bg-white rounded-[14px] border border-[#E5E5EA] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] divide-y divide-[#E5E5EA]/70">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "w-full flex items-center justify-between min-h-[48px] px-3.5 py-3 transition-colors ios-row-tap",
                          isActive ? "bg-[#1B62E3]/5 text-[#1B62E3]" : "text-[#0B172D] hover:bg-[#F2F2F7]"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0",
                            isActive 
                              ? "bg-[#1B62E3] text-white shadow-xs" 
                              : "bg-[#F2F2F7] text-[#68768A]"
                          )}>
                            <Icon className="h-4 w-4 stroke-[1.8]" />
                          </div>
                          <span className={cn(
                            "text-ios-body truncate",
                            isActive ? "font-bold text-[#1B62E3]" : "font-medium text-[#0B172D]"
                          )}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#1B62E3] text-white">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 stroke-[1.5] text-[#C7C7CC]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Admin and Session Group */}
            <div className="space-y-1.5 pt-2">
              <h3 className="px-3 text-ios-caption2 font-bold tracking-wider text-[#8E8E93] uppercase">
                CUENTA Y SEGURIDAD
              </h3>
              <div className="bg-white rounded-[14px] border border-[#E5E5EA] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] divide-y divide-[#E5E5EA]/70">
                {session?.user?.isSuperAdmin && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="w-full flex items-center justify-between min-h-[48px] px-3.5 py-3 ios-row-tap text-[#0B172D]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[#0B172D] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4 w-4 stroke-[1.8]" />
                      </div>
                      <span className="text-ios-body font-medium">Consola SaaS Admin</span>
                    </div>
                    <ChevronRight className="h-4 w-4 stroke-[1.5] text-[#C7C7CC]" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center justify-between min-h-[48px] px-3.5 py-3 ios-row-tap text-red-600 text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-[8px] bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <LogOut className="h-4 w-4 stroke-[1.8]" />
                    </div>
                    <span className="text-ios-body font-medium">Cerrar sesión</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom spacing to clear the floating close button */}
          <div className="h-28 shrink-0" />
        </div>
      )}
    </>
  );
}
