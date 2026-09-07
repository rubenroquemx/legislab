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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[52px]',
              isActive
                ? 'text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[52px] text-zinc-500 hover:text-zinc-800"
      >
        <Menu className="h-4 w-4 text-zinc-400" />
        <span className="text-[10px] mt-1 font-medium">Menú</span>
      </button>
    </nav>
  );
}
