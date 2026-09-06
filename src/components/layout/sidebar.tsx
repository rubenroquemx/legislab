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
  Layers, 
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
    sectionTitle: 'ADMINISTRACIÓN',
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
    sectionTitle: 'TRABAJO LEGISLATIVO',
    items: [
      { name: 'Iniciativas', href: '/iniciativas', icon: FileText, isNew: true },
      { name: 'Discursos', href: '/discursos', icon: Mic, isNew: true },
      { name: 'Boletines', href: '/boletines', icon: Newspaper, isNew: true },
      { name: 'Marco Jurídico', href: '/marco-juridico', icon: Scale },
    ],
  },
  {
    sectionTitle: 'MEDIOS',
    items: [
      { name: 'Monitoreo', href: '/medios', icon: Radio },
    ],
  },
  {
    sectionTitle: 'CONFIGURACIÓN',
    items: [
      { name: 'General', href: '/configuracion?tab=general', icon: Settings },
      { name: 'Usuarios', href: '/usuarios', icon: Users, badge: '6' },
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200/80 text-gray-700 select-none">
      {/* Brand Header with TailAdmin Logo Style */}
      <div className="h-18 flex items-center justify-between px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white gap-0.5 px-1.5 py-1">
            <span className="w-1.5 h-4 bg-white rounded-full"></span>
            <span className="w-1.5 h-6 bg-white rounded-full"></span>
            <span className="w-1.5 h-3 bg-white rounded-full"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 tracking-tight text-lg leading-tight">
              Tail<span className="text-blue-600">Admin</span>
            </span>
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase -mt-0.5">
              LegisLab Edition
            </span>
          </div>
        </Link>

        {/* Close Button on Mobile */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Despacho / User Card in Sidebar */}
      <div className="p-4 border-b border-gray-100">
        <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Dip. Ruben Roque"
              className="w-8 h-8 rounded-full object-cover border border-white shadow-xs shrink-0"
            />
            <div className="overflow-hidden text-left min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate leading-tight">Dip. Ruben Roque</p>
              <p className="text-[10px] text-gray-500 truncate">Distrito 04 Federal</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* 1. Escritorio (Dashboard) at the top */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            onClick={() => onCloseMobile?.()}
            className={cn(
              'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group',
              isDashboardActive
                ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={cn(
                'h-4 w-4 transition-colors',
                isDashboardActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'
              )} />
              <span>Escritorio (Dashboard)</span>
            </div>
          </Link>
        </div>

        {/* 2. Structured Sections */}
        {navSections.map((section) => (
          <div key={section.sectionTitle} className="space-y-1.5">
            <h4 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                      'flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all group',
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'
                      )} />
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isNew && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                          NEW
                        </span>
                      )}
                      {item.badge && (
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen shrink-0 sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
