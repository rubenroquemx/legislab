'use client';

import React from 'react';
import { useEdgeSwipeBack } from '@/hooks/use-swipe-gesture';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IosEdgeSwipeContainerProps {
  children: React.ReactNode;
  onBack: () => void;
  enabled?: boolean;
  className?: string;
  showBackAffordance?: boolean;
}

export function IosEdgeSwipeContainer({
  children,
  onBack,
  enabled = true,
  className,
  showBackAffordance = true,
}: IosEdgeSwipeContainerProps) {
  const { isSwiping, translateX, dragProgress } = useEdgeSwipeBack({
    onBack,
    enabled,
    edgeThreshold: 45,
    triggerDistance: 70,
  });

  return (
    <div 
      className={cn('relative w-full h-full overflow-hidden flex flex-col', className)}
      data-ios-edge-swipe={enabled ? 'true' : undefined}
    >
      {/* Visual iOS Edge Swipe Indicator (pill arrow that follows drag) */}
      {enabled && isSwiping && translateX > 15 && showBackAffordance && (
        <div
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center pointer-events-none transition-opacity"
          style={{
            opacity: Math.min(dragProgress * 1.5, 1),
            transform: `translateY(-50%) translateX(${Math.min(translateX * 0.2, 20)}px)`,
          }}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </div>
      )}

      {/* Interactive Slidable Content */}
      <div
        style={{
          transform: isSwiping ? `translateX(${translateX}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="w-full h-full flex flex-col min-h-0 flex-1"
      >
        {children}
      </div>
    </div>
  );
}
