'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface IosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'tertiary' | 'outline' | 'destructive' | 'success' | 'tinted' | 'plain';
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
      primary: 'bg-[#1B62E3] hover:bg-[#1550BA] text-white shadow-xs border border-[#1B62E3]/20 active:bg-[#1550BA]',
      secondary: 'bg-[#0B172D] hover:bg-[#152542] text-white shadow-xs border border-[#0B172D]/30 active:bg-[#152542]',
      accent: 'bg-[#CA7B20] hover:bg-[#AF6818] text-white shadow-xs border border-[#CA7B20]/20 active:bg-[#AF6818]',
      outline: 'bg-white hover:bg-[#F3F5F9] text-[#0B172D] border border-[#E2E8F0] shadow-2xs',
      tertiary: 'bg-transparent hover:bg-[#F0F2F5] text-[#68768A] hover:text-[#0B172D]',
      destructive: 'bg-[#FF3B30] hover:bg-[#D70015] text-white shadow-xs border border-[#FF3B30]/20',
      success: 'bg-[#34C759] hover:bg-[#28A745] text-white shadow-xs border border-[#34C759]/20',
      tinted: 'bg-[#EBF2FC] hover:bg-[#D8E7FA] text-[#1B62E3] border border-[#1B62E3]/15',
      plain: 'bg-transparent text-[#1B62E3] hover:opacity-80 p-0 h-auto',
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
