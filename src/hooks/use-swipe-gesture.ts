'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface EdgeSwipeOptions {
  onBack: () => void;
  enabled?: boolean;
  edgeThreshold?: number; // Distance in px from left edge to start gesture (default 40px)
  triggerDistance?: number; // Minimum px drag to trigger back (default 75px)
  maxVerticalRatio?: number; // Max dy/dx ratio to avoid triggering during vertical scroll (default 0.7)
}

/**
 * Hook to support native iOS-style edge swipe from the left edge of the screen to go back
 */
export function useEdgeSwipeBack({
  onBack,
  enabled = true,
  edgeThreshold = 40,
  triggerDistance = 75,
  maxVerticalRatio = 0.7,
}: EdgeSwipeOptions) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isSwiping, setIsSwiping] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;

      const isEdge = touch.clientX <= edgeThreshold;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        isEdge,
      };

      if (isEdge) {
        setIsSwiping(true);
        setTranslateX(0);
        setDragProgress(0);
      }
    },
    [enabled, edgeThreshold]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current || !touchStartRef.current.isEdge) return;
      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartRef.current.x;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // If vertical movement dominates, cancel swipe gesture
      if (dx > 0 && dy / dx > maxVerticalRatio) {
        setIsSwiping(false);
        setTranslateX(0);
        setDragProgress(0);
        touchStartRef.current.isEdge = false;
        return;
      }

      if (dx > 0) {
        if (e.cancelable) e.preventDefault();
        const clampedDx = Math.min(dx, window.innerWidth);
        setTranslateX(clampedDx);
        setDragProgress(Math.min(clampedDx / (window.innerWidth * 0.45), 1));
      }
    },
    [enabled, maxVerticalRatio]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current || !touchStartRef.current.isEdge) {
        setIsSwiping(false);
        setTranslateX(0);
        setDragProgress(0);
        return;
      }

      const touch = e.changedTouches[0];
      if (touch) {
        const dx = touch.clientX - touchStartRef.current.x;
        if (dx >= triggerDistance) {
          onBack();
        }
      }

      setIsSwiping(false);
      setTranslateX(0);
      setDragProgress(0);
      touchStartRef.current = null;
    },
    [enabled, triggerDistance, onBack]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isSwiping, translateX, dragProgress };
}

interface DirectionalSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minDistance?: number;
  maxOrthogonalDistance?: number;
}

/**
 * Hook for directional swipe gestures (cards, lists, tabs)
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minDistance = 45,
  maxOrthogonalDistance = 60,
}: DirectionalSwipeOptions) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX >= minDistance && absY <= maxOrthogonalDistance) {
      if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      }
    } else if (absY >= minDistance && absX <= maxOrthogonalDistance) {
      if (dy < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (dy > 0 && onSwipeDown) {
        onSwipeDown();
      }
    }

    touchStartRef.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
