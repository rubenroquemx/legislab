'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Smartphone,
  Users,
  Settings,
  ArrowLeft,
  Server,
  Zap,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getSaasMetricsAction } from '@/app/actions/saas-admin';

const ADMIN_NAV = [
  {
    name: 'Vista General',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Despachos Legislativos',
    href: '/admin/despachos',
    icon: Building2,
  },
  {
    name: 'Instancias WhatsApp',
    href: '/admin/whatsapp',
    icon: Smartphone,
  },
  {
    name: 'Usuarios Globales',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    name: 'Ajustes SaaS',
    href: '/admin/configuracion',
    icon: Settings,
  },
];

export default function SaasAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await getSaasMetricsAction();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    }
    load();
  }, [pathname]);

  const isCol = collapsed;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] text-zinc-900 select-none">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen shrink-0 sticky top-0 z-30 transition-all duration-300 bg-[#fbfbfb] border-r border-zinc-200/80',
          isCol ? 'w-16' : 'w-60'
        )}
      >
        {/* Header con Logo */}
        <div
          className={cn(
            'h-14 flex items-center border-b border-zinc-200/80 px-3',
            isCol ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon.svg"
              alt="LegisLab"
              className="h-7 w-7 shrink-0 object-contain"
            />
            {!isCol && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                <span className="font-bold text-zinc-900 text-sm tracking-tight">
                  LegisLab
                </span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1 py-0.2 rounded font-medium">
                  SaaS Admin
                </span>
              </div>
            )}
          </Link>

          {!isCol && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
              title="Colapsar menú lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!isCol && (
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Consola Central
            </div>
          )}

          {ADMIN_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCol ? item.name : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all group',
                  isCol ? 'justify-center p-2.5' : 'px-2.5 py-2',
                  isActive
                    ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700'
                  )}
                />
                {!isCol && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-zinc-200/80 space-y-1">
          {isCol && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors w-full flex justify-center"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <Link
            href="/dashboard"
            title={isCol ? 'Volver a Despacho Activo' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors',
              isCol ? 'justify-center p-2.5 w-full' : 'px-2.5 py-1.5'
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-zinc-500" />
            {!isCol && <span>Volver a Despacho</span>}
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-14 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-100"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900">Panel Superadmin SaaS</span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Plataforma Activa</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
              <span>Ir a Despacho Activo</span>
            </Link>

            <div className="h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              RR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20">
          <div className="max-w-[1520px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[85vw] flex flex-col h-full bg-[#fbfbfb] shadow-xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-14 flex items-center justify-between border-b border-zinc-200/80 px-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-black text-xs">
                  L
                </div>
                <span className="font-semibold text-zinc-900 text-sm">LegisLab Admin</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}