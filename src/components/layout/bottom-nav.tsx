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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-xs">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[54px] active:scale-95',
              isActive
                ? 'text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[54px] text-zinc-500 hover:text-zinc-800 active:scale-95"
      >
        <Menu className="h-4 w-4 text-zinc-400" />
        <span className="text-[10px] mt-0.5 font-medium tracking-tight">Menú</span>
      </button>
    </nav>
  );
}