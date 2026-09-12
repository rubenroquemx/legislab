'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface IosSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function IosSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: IosSegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-xl select-none backdrop-blur-xs',
        size === 'sm' ? 'h-8' : 'h-10',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ios-press',
              size === 'sm' ? 'py-1 text-[11px]' : 'py-1.5 text-xs',
              isSelected
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                  isSelected
                    ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                    : 'bg-zinc-300/60 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
