'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('px-3.5 pb-1.5 flex items-end justify-between gap-2', className)}>
      <div>
        <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface InsetGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function InsetGroup({ children, className }: InsetGroupProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#161b22] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ListRowProps {
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  value?: string | React.ReactNode;
  badge?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ListRow({
  icon,
  label,
  sublabel,
  value,
  badge,
  chevron,
  onClick,
  destructive = false,
  className,
  children,
}: ListRowProps) {
  const isClickable = Boolean(onClick);

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'px-4 py-3 flex items-center justify-between gap-3 min-h-[44px]',
        isClickable && 'cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors ios-press',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className={cn('shrink-0 text-zinc-500 dark:text-zinc-400', destructive && 'text-red-500')}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-xs font-semibold truncate',
              destructive ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && <div className="shrink-0">{badge}</div>}
        {value && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium text-right truncate max-w-[180px]">
            {value}
          </div>
        )}
        {children}
        {chevron && (
          <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
        )}
      </div>
    </div>
  );

  return content;
}
