'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface IosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'success' | 'tinted' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const IosButton = forwardRef<HTMLButtonElement, IosButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-120 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ios-press';

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5 min-w-[32px]',
      md: 'h-10 px-4 text-xs gap-2 min-w-[40px]',
      lg: 'h-12 px-5 text-sm gap-2.5 min-w-[48px]',
    };

    const variantStyles = {
      primary: 'bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-xs border border-[#007AFF]/20',
      secondary: 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700',
      tertiary: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300',
      destructive: 'bg-[#FF3B30] hover:bg-[#D70015] text-white shadow-xs border border-[#FF3B30]/20',
      success: 'bg-[#34C759] hover:bg-[#28A745] text-white shadow-xs border border-[#34C759]/20',
      tinted: 'bg-[#E5F1FF] hover:bg-[#CCE3FF] text-[#007AFF] dark:bg-[#007AFF]/20 dark:text-[#58A6FF]',
      plain: 'bg-transparent text-[#007AFF] hover:opacity-80 p-0 h-auto',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);
IosButton.displayName = 'IosButton';
