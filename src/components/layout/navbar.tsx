'use client';
import { Bell, Search, Plus, Menu } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 max-w-md w-full">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

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

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/redactor"
          className="hidden md:inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Redactar</span>
        </Link>

        <button 
          type="button"
          className="relative p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
        </button>

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
