'use client';
import { useState } from 'react';
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
  MessageSquareText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isNew?: boolean;
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    sectionTitle: 'Administración',
    items: [
      { name: 'Agenda', href: '/agenda', icon: Calendar },
      { name: 'Directorio', href: '/directorio', icon: Contact },
      { name: 'Grupos', href: '/grupos', icon: UsersRound },
      { name: 'Atención ciudadana', href: '/atencion-ciudadana', icon: MessageSquareText, badge: '4', isNew: true },
      { name: 'Gestiones', href: '/gestiones', icon: FolderKanban, badge: '12' },
      { name: 'Tareas', href: '/tareas', icon: CheckSquare, badge: '6' },
      { name: 'Gestión territorial', href: '/territorio', icon: Compass },
    ],
  },
  {
    sectionTitle: 'Trabajo legislativo',
    items: [
      { name: 'Iniciativas', href: '/iniciativas', icon: FileText },
      { name: 'Discursos', href: '/discursos', icon: Mic },
      { name: 'Boletines', href: '/boletines', icon: Newspaper },
      { name: 'Marco Jurídico', href: '/marco-juridico', icon: Scale },
    ],
  },
  {
    sectionTitle: 'Medios',
    items: [
      { name: 'Monitoreo', href: '/medios', icon: Radio },
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
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/dashboard';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#fbfbfb] border-r border-zinc-200/80 text-zinc-700 select-none">
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200/80">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-black text-xs shadow-xs">
            L
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900 text-sm tracking-tight">
              LegisLab
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded">
              v1.0
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        <div>
          <Link
            href="/dashboard"
            onClick={() => onCloseMobile?.()}
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group',
              isDashboardActive
                ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={cn('h-4 w-4', isDashboardActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700')} />
              <span>Escritorio</span>
            </div>
          </Link>
        </div>

        {navSections.map((section) => (
          <div key={section.sectionTitle} className="space-y-1">
            <h4 className="px-2.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {section.sectionTitle}
            </h4>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && !item.href.includes('?') && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link 
                    key={item.name}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group',
                      isActive
                        ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700')} />
                      <span>{item.name}</span>
                    </div>

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
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-200/80 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50/60 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 flex-col h-screen shrink-0 sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[85vw] flex flex-col h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
