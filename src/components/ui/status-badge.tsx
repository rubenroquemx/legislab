'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  dotOnly?: boolean;
  size?: 'sm' | 'md';
}

const variantStyles: Record<StatusVariant, { dot: string; text: string; bg: string; border: string }> = {
  default: {
    dot: 'bg-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200/80 dark:border-slate-700/80',
  },
  info: {
    dot: 'bg-blue-600 dark:bg-blue-400',
    text: 'text-blue-900 dark:text-blue-200',
    bg: 'bg-blue-50/70 dark:bg-blue-950/40',
    border: 'border-blue-200/60 dark:border-blue-900/40',
  },
  success: {
    dot: 'bg-emerald-600 dark:bg-emerald-400',
    text: 'text-emerald-900 dark:text-emerald-200',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    border: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  warning: {
    dot: 'bg-amber-600 dark:bg-amber-400',
    text: 'text-amber-900 dark:text-amber-200',
    bg: 'bg-amber-50/70 dark:bg-amber-950/40',
    border: 'border-amber-200/60 dark:border-amber-900/40',
  },
  danger: {
    dot: 'bg-rose-600 dark:bg-rose-400',
    text: 'text-rose-900 dark:text-rose-200',
    bg: 'bg-rose-50/70 dark:bg-rose-950/40',
    border: 'border-rose-200/60 dark:border-rose-900/40',
  },
  neutral: {
    dot: 'bg-zinc-400',
    text: 'text-zinc-700 dark:text-zinc-300',
    bg: 'bg-zinc-50 dark:bg-zinc-800/50',
    border: 'border-zinc-200/80 dark:border-zinc-700/80',
  },
};

export function getStatusVariant(statusName: string): StatusVariant {
  const s = statusName.toLowerCase();
  if (s.includes('resuelt') || s.includes('aprob') || s.includes('complet') || s.includes('activo') || s.includes('real')) return 'success';
  if (s.includes('trámite') || s.includes('proceso') || s.includes('revisión') || s.includes('comisión') || s.includes('pleno')) return 'warning';
  if (s.includes('recibid') || s.includes('pendiente') || s.includes('nuevo') || s.includes('alta') || s.includes('urgente')) return 'info';
  if (s.includes('rechaz') || s.includes('cancel') || s.includes('baja') || s.includes('error')) return 'danger';
  return 'neutral';
}

export function StatusBadge({ 
  status, 
  variant, 
  className,
  dotOnly = false,
  size = 'md'
}: StatusBadgeProps) {
  const resolvedVariant = variant || getStatusVariant(status);
  const v = variantStyles[resolvedVariant];

  if (dotOnly) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className={cn('h-2 w-2 rounded-full shrink-0', v.dot)} />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{status}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        v.bg,
        v.border,
        v.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', v.dot)} />
      <span>{status}</span>
    </span>
  );
}
