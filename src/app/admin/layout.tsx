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
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen shrink-0 sticky top-0 z-30 transition-all duration-300 bg-white border-r border-[#E2E8F0] select-none',
          isCol ? 'w-16' : 'w-60'
        )}
      >
        {/* Header con Logo */}
        <div
          className={cn(
            'h-14 flex items-center border-b border-[#E2E8F0] px-3',
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
                <span className="font-bold text-[#0B172D] text-sm tracking-tight">
                  LegisLab
                </span>
                <span className="text-[10px] font-mono text-[#0B172D] bg-[#E8ECF2] border border-[#0B172D]/20 px-1 py-0.2 rounded font-bold">
                  SaaS Admin
                </span>
              </div>
            )}
          </Link>

          {!isCol && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-[#68768A] hover:text-[#0B172D] rounded-xl hover:bg-[#F3F5F9] transition-colors"
              title="Colapsar menú lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!isCol && (
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#68768A]">
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
                  'flex items-center gap-2.5 rounded-xl text-xs font-medium transition-all group',
                  isCol ? 'justify-center p-2.5' : 'px-2.5 py-2',
                  isActive
                    ? 'bg-[#EBF2FC] text-[#1B62E3] font-bold'
                    : 'text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9]'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-[#1B62E3]' : 'text-[#68768A] group-hover:text-[#0B172D]'
                  )}
                />
                {!isCol && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-[#E2E8F0] space-y-1 bg-white">
          {isCol && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-2 text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9] rounded-xl transition-colors w-full flex justify-center"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <Link
            href="/dashboard"
            title={isCol ? 'Volver a Despacho Activo' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-xl text-xs font-semibold text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9] transition-colors',
              isCol ? 'justify-center p-2.5 w-full' : 'px-2.5 py-2'
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-[#68768A]" />
            {!isCol && <span>Volver a Despacho</span>}
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F5F9]">
        {/* Navbar */}
        <header className="h-14 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-[#68768A] hover:text-[#0B172D] rounded-xl hover:bg-[#F3F5F9]"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B172D]">Panel Superadmin SaaS</span>
              <span className="text-[10px] font-mono bg-[#EBF9EE] text-[#28A745] border border-[#34C759]/25 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                <span>Plataforma Activa</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#0B172D] hover:text-[#1B62E3] bg-[#F3F5F9] hover:bg-[#E8ECF2] border border-[#E2E8F0] px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#68768A]" />
              <span>Ir a Despacho Activo</span>
            </Link>

            <div className="h-7 w-7 rounded-full bg-[#0B172D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              RR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 bg-[#F3F5F9]">
          <div className="max-w-[1520px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0B172D]/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[85vw] flex flex-col h-full bg-white shadow-xl z-10 animate-in slide-in-from-left duration-200 border-r border-[#E2E8F0]">
            <div className="h-14 flex items-center justify-between border-b border-[#E2E8F0] px-4">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon.svg"
                  alt="LegisLab"
                  className="h-6 w-6 object-contain"
                />
                <span className="font-bold text-[#0B172D] text-sm">LegisLab Admin</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-[#68768A] hover:text-[#0B172D] rounded-xl"
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
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-[#EBF2FC] text-[#1B62E3] font-bold'
                        : 'text-[#68768A] hover:text-[#0B172D] hover:bg-[#F3F5F9]'
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