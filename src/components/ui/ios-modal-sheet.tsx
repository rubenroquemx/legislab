'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface IosModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function IosModalSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  leftAction,
  rightAction,
  maxWidth = 'lg',
}: IosModalSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Modal / Bottom Sheet Box */}
      <div
        className={cn(
          'relative w-full bg-white rounded-t-[24px] sm:rounded-2xl border border-[#E2E8F0] shadow-2xl z-10 flex flex-col max-h-[90dvh] overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out',
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#D8DFE8] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-[#F3F5F9]/70">
          <div>
            {leftAction ? (
              leftAction
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-[#1B62E3] hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="text-center px-2">
            {title && (
              <h3 className="text-xs font-bold text-[#0B172D] truncate max-w-[200px] sm:max-w-xs">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] text-[#68768A] truncate">{subtitle}</p>
            )}
          </div>

          <div>
            {rightAction ? (
              rightAction
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-[#68768A] hover:text-[#0B172D] hover:bg-[#E8ECF2] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
