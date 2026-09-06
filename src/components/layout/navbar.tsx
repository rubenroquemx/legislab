'use client';
import { Bell, Search, Plus, Menu, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  return (
    <header className="h-18 bg-white border-b border-gray-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Hamburger & Command Search Bar */}
      <div className="flex items-center gap-4 max-w-lg w-full">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Command Search Bar (TailAdmin Style) */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search or type command..."
            className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-gray-50/90 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Quick Redaction, Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link
          href="/redactor"
          className="hidden md:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-blue-600/20 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva Redacción</span>
        </Link>

        {/* Notifications Bell Button */}
        <button className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill (TailAdmin Style) */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Dip. Ruben Roque"
            className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-2xs"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-gray-900 leading-tight">
              Dip. Ruben Roque
            </span>
            <span className="text-[10px] text-gray-500 leading-tight">
              Titular Despacho
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 hidden lg:block" />
        </div>
      </div>
    </header>
  );
}
