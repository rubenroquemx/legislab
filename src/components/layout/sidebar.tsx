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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useState, useEffect } from 'react';

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
    sectionTitle: 'Administración',
    items: [
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
    sectionTitle: 'Trabajo legislativo',
    items: [
      { name: 'Iniciativas', href: '/iniciativas', icon: FileText, moduleKey: 'redactor_ia' },
      { name: 'Discursos', href: '/discursos', icon: Mic, moduleKey: 'redactor_ia' },
      { name: 'Boletines', href: '/boletines', icon: Newspaper, moduleKey: 'redactor_ia' },
      { name: 'Marco Jurídico', href: '/marco-juridico', icon: Scale, moduleKey: 'marco_juridico' },
    ],
  },
  {
    sectionTitle: 'Medios',
    items: [
      { name: 'Monitoreo', href: '/medios', icon: Radio, moduleKey: 'medios' },
    ],
  },
  {
    sectionTitle: 'Configuración',
    items: [
      { name: 'General', href: '/configuracion?tab=general', icon: Settings },
      { name: 'Usuarios', href: '/usuarios', icon: Users },
      { name: 'Conexiones', href: '/configuracion?tab=conexiones', icon: HardDrive },
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

  const visibleSections = navSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => !item.moduleKey || !enabledModules || enabledModules.includes(item.moduleKey))
  })).filter(sec => sec.items.length > 0);

  const renderContent = (isMobile: boolean) => {
    const isCol = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-[#fbfbfb] border-r border-zinc-200/80 text-zinc-700 select-none transition-all duration-300">
        
        {/* Header con Logo y botón colapsar */}
        <div className={cn(
          "h-14 flex items-center border-b border-zinc-200/80 px-3",
          isCol ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
              L
            </div>
            {!isCol && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                <span className="font-semibold text-zinc-900 text-sm tracking-tight">
                  LegisLab
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded">
                  v1.1
                </span>
              </div>
            )}
          </Link>

          {/* Botón cerrar en móvil */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-200/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Botón colapsar en Desktop */}
          {!isMobile && onToggleCollapse && !isCol && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
              title="Colapsar menú lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className={cn(
          "flex-1 py-3 space-y-3 overflow-y-auto",
          isCol ? "px-2" : "px-3"
        )}>
          
          {/* Escritorio / Dashboard */}
          <div>
            <Link
              href="/dashboard"
              onClick={() => isMobile && onCloseMobile?.()}
              title={isCol ? "Escritorio" : undefined}
              className={cn(
                'flex items-center rounded-lg text-xs font-medium transition-colors group relative',
                isCol ? "justify-center p-2.5" : "justify-between px-2.5 py-1.5",
                isDashboardActive
                  ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={cn('h-4 w-4 shrink-0', isDashboardActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700')} />
                {!isCol && <span>Escritorio</span>}
              </div>
            </Link>
          </div>

          {/* Secciones del Menú */}
          {visibleSections.map((section) => (
            <div key={section.sectionTitle} className="space-y-1">
              {!isCol ? (
                <h4 className="px-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {section.sectionTitle}
                </h4>
              ) : (
                <div className="h-px bg-zinc-200/60 my-1 mx-1.5" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && !item.href.includes('?') && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      onClick={() => isMobile && onCloseMobile?.()}
                      title={isCol ? item.name : undefined}
                      className={cn(
                        'flex items-center rounded-lg text-xs font-medium transition-colors group relative',
                        isCol ? "justify-center p-2.5" : "justify-between px-2.5 py-1.5",
                        isActive
                          ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700')} />
                        {!isCol && <span>{item.name}</span>}
                      </div>

                      {!isCol ? (
                        <div className="flex items-center gap-1.5">
                          {item.isNew && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                              NEW
                            </span>
                          )}
                          {item.badge && (
                            <span className={cn(
                              'text-[10px] font-mono px-1.5 py-0.2 rounded-md',
                              isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-200/70 text-zinc-600'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ) : (
                        item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
                        )
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Expand toggle if collapsed & Cerrar sesión */}
        <div className={cn(
          "p-2 border-t border-zinc-200/80 space-y-1",
          isCol ? "flex flex-col items-center" : ""
        )}>
          {!isMobile && isCol && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors w-full flex justify-center"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <Link
            href="/admin"
            title={isCol ? "Consola SaaS Superadmin" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/80 transition-colors",
              isCol ? "justify-center p-2.5 w-full" : "px-2.5 py-1.5"
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-500" />
            {!isCol && <span>Consola SaaS Admin</span>}
          </Link>

          <Link
            href="/"
            title={isCol ? "Cerrar sesión" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50/60 transition-colors",
              isCol ? "justify-center p-2.5 w-full" : "px-2.5 py-1.5"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCol && <span>Cerrar sesión</span>}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Collapsible with smooth width transition) */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen shrink-0 sticky top-0 z-30 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[85vw] flex flex-col h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}