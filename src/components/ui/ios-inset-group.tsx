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
    <div className={cn('px-4 pb-1.5 pt-3 flex items-end justify-between gap-2', className)}>
      <div>
        <h3 className="text-ios-footnote font-semibold text-[#8E8E93] uppercase tracking-wider">
          {title}
        </h3>
        {subtitle && (
          <p className="text-ios-caption1 text-[#8E8E93] mt-0.5">{subtitle}</p>
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
        'bg-white rounded-[12px] border border-[#E5E5EA]/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-[#E5E5EA]/60',
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
        'px-4 py-2.5 flex items-center justify-between gap-3 min-h-[44px]',
        isClickable && 'ios-row-tap cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className={cn('shrink-0 text-[#68768A]', destructive && 'text-red-500')}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-ios-body font-normal truncate',
              destructive ? 'text-red-600 font-medium' : 'text-[#0B172D]'
            )}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-ios-caption1 text-[#8E8E93] truncate mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && <div className="shrink-0">{badge}</div>}
        {value && (
          <div className="text-ios-body text-[#8E8E93] font-normal text-right truncate max-w-[180px]">
            {value}
          </div>
        )}
        {children}
        {chevron && (
          <ChevronRight className="h-4 w-4 text-[#C7C7CC] stroke-[1.5] shrink-0" />
        )}
      </div>
    </div>
  );

  return content;
}
