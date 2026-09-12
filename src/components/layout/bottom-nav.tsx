'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Calendar,
  FolderKanban, 
  CheckSquare,
  Contact,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onOpenDrawer: () => void;
}

export function BottomNav({ onOpenDrawer }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { name: 'Escritorio', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Directorio', href: '/directorio', icon: Contact },
    { name: 'Gestiones', href: '/gestiones', icon: FolderKanban },
    { name: 'Tareas', href: '/tareas', icon: CheckSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-[#E5E5EA]/80 px-2 pt-1.5 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.25rem))] flex items-center justify-around select-none">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-[10px] min-w-[56px] min-h-[44px] ios-row-tap group transition-all duration-100',
              isActive
                ? 'text-[#1B62E3]'
                : 'text-[#8E8E93]'
            )}
          >
            <div className="relative">
              <Icon 
                className={cn(
                  'h-[22px] w-[22px] transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90',
                  isActive 
                    ? 'text-[#1B62E3] stroke-[2.2] scale-105' 
                    : 'text-[#8E8E93] stroke-[1.6]'
                )} 
              />
            </div>
            <span className={cn(
              "text-[10px] mt-0.5 tracking-tight leading-tight",
              isActive ? "font-semibold text-[#1B62E3]" : "font-normal text-[#8E8E93]"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-[10px] min-w-[56px] min-h-[44px] text-[#8E8E93] ios-row-tap transition-all duration-100"
        aria-label="Abrir menú"
      >
        <Menu className="h-[22px] w-[22px] text-[#8E8E93] stroke-[1.6] active:scale-90 transition-transform" />
        <span className="text-[10px] mt-0.5 tracking-tight leading-tight font-normal text-[#8E8E93]">
          Menú
        </span>
      </button>
    </nav>
  );
}