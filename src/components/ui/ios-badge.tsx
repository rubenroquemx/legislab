'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface IosBadgeProps {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'purple' | 'gray';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function IosBadge({ variant = 'blue', children, icon, className }: IosBadgeProps) {
  const variantStyles = {
    blue: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20',
    green: 'bg-[#34C759]/10 text-[#28A745] border-[#34C759]/20 dark:text-[#34C759]',
    amber: 'bg-[#FF9500]/10 text-[#D97706] border-[#FF9500]/20 dark:text-[#FBBF24]',
    red: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
    indigo: 'bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/20',
    purple: 'bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/20',
    gray: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
