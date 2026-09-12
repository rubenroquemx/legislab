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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-[#E2E8F0] px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg select-none">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-120 min-w-[56px] min-h-[44px] ios-press',
              isActive
                ? 'text-[#1B62E3] font-bold'
                : 'text-[#68768A] hover:text-[#0B172D] font-medium'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-5 w-5 transition-transform duration-120', isActive ? 'text-[#1B62E3] scale-105 stroke-[2.3]' : 'text-[#68768A] stroke-[1.8]')} />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-120 min-w-[56px] min-h-[44px] text-[#68768A] hover:text-[#0B172D] font-medium ios-press cursor-pointer"
      >
        <Menu className="h-5 w-5 text-[#68768A] stroke-[1.8]" />
        <span className="text-[10px] mt-1 tracking-tight leading-none">Menú</span>
      </button>
    </nav>
  );
}