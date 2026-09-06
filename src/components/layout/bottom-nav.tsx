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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px]',
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <div className={cn(
              'p-1 rounded-lg transition-colors',
              isActive ? 'bg-blue-50' : 'bg-transparent'
            )}>
              <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-gray-500 hover:text-gray-800 transition-all min-w-[56px]"
      >
        <div className="p-1 rounded-lg bg-gray-100">
          <Menu className="h-5 w-5 text-gray-600" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Más</span>
      </button>
    </nav>
  );
}
