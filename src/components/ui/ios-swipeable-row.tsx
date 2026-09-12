'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  color?: string; // bg color class, e.g. 'bg-[#1B62E3]', 'bg-[#34C759]', 'bg-[#FF3B30]'
  onClick: () => void;
}

export interface IosSwipeableRowProps {
  children: React.ReactNode;
  actionsRight?: SwipeAction[];
  actionsLeft?: SwipeAction[];
  className?: string;
  disabled?: boolean;
}

export function IosSwipeableRow({
  children,
  actionsRight = [],
  actionsLeft = [],
  className,
  disabled = false,
}: IosSwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isOpenRight, setIsOpenRight] = useState(false);
  const [isOpenLeft, setIsOpenLeft] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const rightActionWidth = actionsRight.length * 68;
  const leftActionWidth = actionsLeft.length * 68;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // If vertical movement dominates, release and allow full vertical scroll
    if (dy > 6 && dy >= Math.abs(dx)) {
      touchStartRef.current = null;
      if (offsetX !== 0 && !isOpenRight && !isOpenLeft) {
        setOffsetX(0);
      }
      return;
    }

    // Only swipe horizontally if horizontal movement is clearly intended
    if (Math.abs(dx) > 8 && Math.abs(dx) > dy * 1.4) {
      if (dx < 0 && actionsRight.length > 0) {
        const base = isOpenRight ? -rightActionWidth : 0;
        const target = Math.max(base + dx, -rightActionWidth - 25);
        setOffsetX(target);
      } else if (dx > 0 && actionsLeft.length > 0) {
        const base = isOpenLeft ? leftActionWidth : 0;
        const target = Math.min(base + dx, leftActionWidth + 25);
        setOffsetX(target);
      } else if (isOpenRight && dx > 0) {
        setOffsetX(Math.min(0, -rightActionWidth + dx));
      } else if (isOpenLeft && dx < 0) {
        setOffsetX(Math.max(0, leftActionWidth + dx));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current && offsetX === 0) return;
    touchStartRef.current = null;

    if (offsetX < -rightActionWidth * 0.4 && actionsRight.length > 0) {
      setOffsetX(-rightActionWidth);
      setIsOpenRight(true);
      setIsOpenLeft(false);
    } else if (offsetX > leftActionWidth * 0.4 && actionsLeft.length > 0) {
      setOffsetX(leftActionWidth);
      setIsOpenLeft(true);
      setIsOpenRight(false);
    } else {
      setOffsetX(0);
      setIsOpenRight(false);
      setIsOpenLeft(false);
    }
  };

  const closeActions = () => {
    setOffsetX(0);
    setIsOpenRight(false);
    setIsOpenLeft(false);
  };

  return (
    <div className={cn('relative overflow-hidden bg-white select-none', className)}>
      {/* Left Actions (Reveal on swipe right) */}
      {actionsLeft.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex items-stretch z-0">
          {actionsLeft.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                closeActions();
                action.onClick();
              }}
              className={cn(
                'w-[68px] flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 transition-transform active:opacity-80',
                action.color || 'bg-[#34C759]'
              )}
            >
              {action.icon}
              <span className="leading-none">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions (Reveal on swipe left) */}
      {actionsRight.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
          {actionsRight.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                closeActions();
                action.onClick();
              }}
              className={cn(
                'w-[68px] flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 transition-transform active:opacity-80',
                action.color || 'bg-[#1B62E3]'
              )}
            >
              {action.icon}
              <span className="leading-none">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Row Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isOpenRight || isOpenLeft) {
            closeActions();
          }
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: touchStartRef.current ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="relative z-10 bg-white"
      >
        {children}
      </div>
    </div>
  );
}
