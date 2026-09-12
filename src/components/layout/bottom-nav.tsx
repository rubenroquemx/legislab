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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#121824]/85 backdrop-blur-2xl border-t border-zinc-200/80 dark:border-zinc-800 px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg">
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
                ? 'text-[#007AFF] font-bold'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-5 w-5 transition-transform duration-120', isActive ? 'text-[#007AFF] scale-105 stroke-[2.3]' : 'text-zinc-400 dark:text-zinc-500 stroke-[1.8]')} />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-120 min-w-[56px] min-h-[44px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium ios-press cursor-pointer"
      >
        <Menu className="h-5 w-5 text-zinc-400 dark:text-zinc-500 stroke-[1.8]" />
        <span className="text-[10px] mt-1 tracking-tight leading-none">Menú</span>
      </button>
    </nav>
  );
}