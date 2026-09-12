'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface IosBadgeProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'navy' | 'gray';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function IosBadge({ variant = 'blue', children, icon, className }: IosBadgeProps) {
  const variantStyles = {
    primary: 'bg-[#E8ECF2] text-[#0B172D] border-[#0B172D]/20 font-bold',
    navy: 'bg-[#0B172D] text-white border-[#0B172D]/30 font-bold',
    secondary: 'bg-[#EBF2FC] text-[#1B62E3] border-[#1B62E3]/25 font-bold',
    blue: 'bg-[#EBF2FC] text-[#1B62E3] border-[#1B62E3]/25 font-bold',
    accent: 'bg-[#FDF4EB] text-[#CA7B20] border-[#CA7B20]/30 font-bold',
    orange: 'bg-[#FDF4EB] text-[#CA7B20] border-[#CA7B20]/30 font-bold',
    amber: 'bg-[#FDF4EB] text-[#CA7B20] border-[#CA7B20]/30 font-bold',
    neutral: 'bg-[#F0F2F5] text-[#68768A] border-[#E2E8F0] font-medium',
    gray: 'bg-[#F0F2F5] text-[#68768A] border-[#E2E8F0] font-medium',
    green: 'bg-[#EBF9EE] text-[#28A745] border-[#34C759]/25 font-semibold',
    red: 'bg-[#FFECEB] text-[#FF3B30] border-[#FF3B30]/25 font-semibold',
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
