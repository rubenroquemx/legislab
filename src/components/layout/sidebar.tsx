'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  UsersRound,
  HardDrive,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isNew?: boolean;
  moduleKey?: string;
  hasSubmenu?: boolean;
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    sectionTitle: 'ADMINISTRACIÓN',
    items: [
      { name: 'Agenda', href: '/agenda', icon: Calendar, moduleKey: 'agenda', hasSubmenu: true },
      { name: 'Directorio', href: '/directorio', icon: Contact, moduleKey: 'directorio', hasSubmenu: true },
      { name: 'Grupos', href: '/grupos', icon: UsersRound, moduleKey: 'grupos' },
      { name: 'Atención ciudadana', href: '/atencion-ciudadana', icon: MessageSquareText, badge: '4', isNew: true, moduleKey: 'atencion_ciudadana', hasSubmenu: true },
      { name: 'Gestiones', href: '/gestiones', icon: FolderKanban, badge: '12', moduleKey: 'gestiones', hasSubmenu: true },
      { name: 'Tareas', href: '/tareas', icon: CheckSquare, badge: '6', moduleKey: 'tareas' },
      { name: 'Gestión territorial', href: '/territorio', icon: Compass, moduleKey: 'territorio' },
    ],
  },
  {
    sectionTitle: 'TRABAJO LEGISLATIVO',
    items: [
      { name: 'Iniciativas', href: '/iniciativas', icon: FileText, moduleKey: 'redactor_ia', hasSubmenu: true },
      { name: 'Discursos', href: '/discursos', icon: Mic, moduleKey: 'redactor_ia', hasSubmenu: true },
      { name: 'Boletines', href: '/boletines', icon: Newspaper, moduleKey: 'redactor_ia', hasSubmenu: true },
      { name: 'Marco Jurídico', href: '/marco-juridico', icon: Scale, moduleKey: 'marco_juridico' },
    ],
  },
  {
    sectionTitle: 'MEDIOS',
    items: [
      { name: 'Monitoreo de medios', href: '/medios', icon: Radio, moduleKey: 'medios' },
    ],
  },
  {
    sectionTitle: 'SISTEMA Y AJUSTES',
    items: [
      { name: 'General', href: '/configuracion?tab=general', icon: Settings, hasSubmenu: true },
      { name: 'Usuarios y equipo', href: '/usuarios', icon: Users, hasSubmenu: true },
      { name: 'Conexiones y Cloud', href: '/configuracion?tab=conexiones', icon: HardDrive },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ 
  collapsed = false, 
  onToggleCollapse,
  mobileOpen = false, 
  onCloseMobile 
}: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [enabledModules, setEnabledModules] = useState<string[] | null>(null);

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

  const isDashboardActive = pathname === '/dashboard';

  const [drawerTranslateX, setDrawerTranslateX] = useState(0);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const drawerTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    drawerTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDraggingDrawer(true);
  };

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (!drawerTouchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - drawerTouchStartRef.current.x;
    const dy = Math.abs(touch.clientY - drawerTouchStartRef.current.y);

    if (dx < 0 && Math.abs(dx) > dy * 0.5) {
      setDrawerTranslateX(dx);
    } else if (dx > 0) {
      setDrawerTranslateX(0);
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    if (!drawerTouchStartRef.current) {
      setIsDraggingDrawer(false);
      setDrawerTranslateX(0);
      return;
    }

    const touch = e.changedTouches[0];
    if (touch) {
      const dx = touch.clientX - drawerTouchStartRef.current.x;
      if (dx < -60) {
        onCloseMobile?.();
      }
    }

    setIsDraggingDrawer(false);
    setDrawerTranslateX(0);
    drawerTouchStartRef.current = null;
  };

  const visibleSections = navSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => !item.moduleKey || !enabledModules || enabledModules.includes(item.moduleKey))
  })).filter(sec => sec.items.length > 0);

  const renderContent = (isMobile: boolean) => {
    const isCol = !isMobile && collapsed;

    return (
      <div className={cn(
        "flex flex-col h-full text-[#0F172A] select-none",
        isMobile ? "bg-[#F2F2F7]/95 backdrop-blur-2xl" : "bg-[#F8FAFC] border-r border-[#E2E8F0]"
      )}>
        
        {/* Header con Logo y botón de cerrar */}
        <div className={cn(
          "h-16 flex items-center px-4 shrink-0 border-b border-[#E5E5EA]/60",
          isCol ? "justify-center" : "justify-between",
          isMobile && "pt-safe"
        )}>
          <Link 
            href="/dashboard" 
            onClick={() => isMobile && onCloseMobile?.()}
            className="flex items-center gap-3 overflow-hidden active:opacity-75 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="LegisLab"
              className="h-8 w-8 shrink-0 object-contain rounded-[8px] shadow-xs"
            />
            {!isCol && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0F172A] text-ios-headline tracking-tight">
                    LegisLab
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] bg-white border border-[#E5E5EA] px-1.5 py-0.5 rounded-[4px] font-semibold">
                    PRO
                  </span>
                </div>
                <span className="text-ios-caption2 text-[#94A3B8] leading-none">
                  Gestión Parlamentaria
                </span>
              </div>
            )}
          </Link>

          {/* Botón cerrar en móvil (Estilo iOS circular) */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E5E5EA] text-[#0F172A] active:scale-95 active:opacity-70 transition-transform"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4 stroke-[2.2]" />
            </button>
          )}

          {/* Botón colapsar en Desktop */}
          {!isMobile && onToggleCollapse && !isCol && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-[10px] hover:bg-white/80 active:scale-95 transition-all"
              title="Colapsar menú lateral"
            >
              <PanelLeftClose className="h-4 w-4 stroke-[1.75]" />
            </button>
          )}
        </div>

        {/* Contenido navegable en Inset Grouped Lists */}
        <nav className={cn(
          "flex-1 py-4 overflow-y-auto space-y-4 overscroll-contain",
          isCol ? "px-2" : "px-3.5"
        )}>
          
          {/* Grupo 1: Escritorio / Vista Principal */}
          {!isCol ? (
            <div className="space-y-1">
              <div className="bg-white rounded-[12px] border border-[#E5E5EA]/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <Link
                  href="/dashboard"
                  onClick={() => isMobile && onCloseMobile?.()}
                  className={cn(
                    'w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 ios-row-tap group',
                    isDashboardActive ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-[#0F172A]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 shadow-xs",
                      isDashboardActive ? "bg-[#2563EB] text-white" : "bg-[#0F172A] text-white"
                    )}>
                      <LayoutDashboard className="h-4 w-4 stroke-[1.75]" />
                    </div>
                    <span className={cn("text-ios-body font-medium", isDashboardActive ? "text-[#2563EB] font-semibold" : "text-[#0F172A]")}>
                      Escritorio
                    </span>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 stroke-[1.5]", isDashboardActive ? "text-[#2563EB]" : "text-[#C7C7CC]")} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                title="Escritorio"
                className={cn(
                  'w-10 h-10 rounded-[10px] flex items-center justify-center transition-all ios-press',
                  isDashboardActive ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-white text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                <LayoutDashboard className="h-5 w-5 stroke-[1.75]" />
              </Link>
            </div>
          )}

          {/* Secciones Inset Grouped */}
          {visibleSections.map((section) => (
            <div key={section.sectionTitle} className="space-y-1">
              {!isCol ? (
                <h4 className="px-3.5 text-ios-footnote font-semibold text-[#94A3B8] tracking-wide uppercase">
                  {section.sectionTitle}
                </h4>
              ) : (
                <div className="h-px bg-[#E5E5EA] my-2 mx-2" />
              )}

              {!isCol ? (
                <div className="bg-white rounded-[12px] border border-[#E5E5EA]/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] divide-y divide-[#E5E5EA]/60">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && !item.href.includes('?') && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link 
                        key={item.name}
                        href={item.href}
                        onClick={() => isMobile && onCloseMobile?.()}
                        className={cn(
                          'w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 ios-row-tap',
                          isActive ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-[#0F172A]'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 shadow-xs",
                            isActive ? "bg-[#2563EB] text-white" : "bg-[#F8FAFC] text-[#64748B]"
                          )}>
                            <Icon className="h-4 w-4 stroke-[1.75]" />
                          </div>
                          <span className={cn(
                            "text-ios-body truncate",
                            isActive ? "text-[#2563EB] font-semibold" : "text-[#0F172A] font-normal"
                          )}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.isNew && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#EBF9EE] text-[#34C759]">
                              NUEVO
                            </span>
                          )}
                          {item.badge && (
                            <span className={cn(
                              'text-ios-caption1 font-semibold px-2 py-0.5 rounded-full',
                              isActive ? 'bg-[#2563EB] text-white' : 'bg-[#E5E5EA] text-[#64748B]'
                            )}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={cn("h-4 w-4 stroke-[1.5]", isActive ? "text-[#2563EB]" : "text-[#C7C7CC]")} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col items-center">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && !item.href.includes('?') && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link 
                        key={item.name}
                        href={item.href}
                        title={item.name}
                        className={cn(
                          'w-10 h-10 rounded-[10px] flex items-center justify-center relative transition-all ios-press',
                          isActive ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-white text-[#64748B] hover:text-[#0F172A]'
                        )}
                      >
                        <Icon className="h-5 w-5 stroke-[1.75]" />
                        {item.badge && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer: Admin & Salir (Inset Grouped) */}
        <div className={cn(
          "p-3.5 border-t border-[#E5E5EA]/60 space-y-2 shrink-0",
          isMobile ? "pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "bg-white",
          isCol ? "flex flex-col items-center" : ""
        )}>
          {!isMobile && isCol && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-[10px] transition-colors w-full flex justify-center"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="h-5 w-5 stroke-[1.75]" />
            </button>
          )}

          {!isCol && (
            <div className="bg-white rounded-[12px] border border-[#E5E5EA]/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] divide-y divide-[#E5E5EA]/60">
              {session?.user?.isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => isMobile && onCloseMobile?.()}
                  className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 ios-row-tap text-[#0F172A]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-[7px] bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 stroke-[1.75]" />
                    </div>
                    <span className="text-ios-body font-medium">Consola SaaS Admin</span>
                  </div>
                  <ChevronRight className="h-4 w-4 stroke-[1.5] text-[#C7C7CC]" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 ios-row-tap text-red-600 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[7px] bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <LogOut className="h-4 w-4 stroke-[1.75]" />
                  </div>
                  <span className="text-ios-body font-medium">Cerrar sesión</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen shrink-0 sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        collapsed ? "w-16" : "w-64"
      )}>
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer with Apple Spring Physics and Backdrop Blur */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dimming backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={onCloseMobile}
          />
          {/* Spring sliding drawer overlay */}
          <aside 
            onTouchStart={handleDrawerTouchStart}
            onTouchMove={handleDrawerTouchMove}
            onTouchEnd={handleDrawerTouchEnd}
            onTouchCancel={handleDrawerTouchEnd}
            style={{
              transform: drawerTranslateX < 0 ? `translateX(${drawerTranslateX}px)` : undefined,
              transition: isDraggingDrawer ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            className="relative w-[300px] max-w-[85vw] flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.25)] z-10 animate-in slide-in-from-left"
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}