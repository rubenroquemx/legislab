'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface EdgeSwipeOptions {
  onBack: () => void;
  enabled?: boolean;
  edgeThreshold?: number; // Distance in px from left edge to start gesture (default 90px)
  triggerDistance?: number; // Minimum px drag to trigger back (default 65px)
}

/**
 * Hook to support native iOS-style edge swipe from the left edge of the screen to go back
 */
export function useEdgeSwipeBack({
  onBack,
  enabled = true,
  edgeThreshold = 90,
  triggerDistance = 65,
}: EdgeSwipeOptions) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isSwiping, setIsSwiping] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean; decided: boolean } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;

      const threshold = typeof window !== 'undefined' ? Math.max(edgeThreshold, window.innerWidth * 0.25) : edgeThreshold;
      const isEdge = touch.clientX <= threshold;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        isEdge,
        decided: false,
      };

      if (isEdge) {
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

      // Give a tiny tolerance zone (8px) before deciding swipe vs vertical scroll
      if (!touchStartRef.current.decided) {
        if (Math.abs(dx) > 8 || dy > 8) {
          touchStartRef.current.decided = true;
          if (dy > dx * 0.85 || dx <= 0) {
            // It's vertical scroll or swiping left -> cancel edge swipe
            touchStartRef.current.isEdge = false;
            setIsSwiping(false);
            setTranslateX(0);
            setDragProgress(0);
            return;
          } else {
            setIsSwiping(true);
          }
        } else {
          return;
        }
      }

      if (dx > 0) {
        if (e.cancelable) e.preventDefault();
        const maxW = typeof window !== 'undefined' ? window.innerWidth : 400;
        const clampedDx = Math.min(dx, maxW);
        setTranslateX(clampedDx);
        setDragProgress(Math.min(clampedDx / (maxW * 0.4), 1));
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current || !touchStartRef.current.isEdge) {
        setIsSwiping(false);
        setTranslateX(0);
        setDragProgress(0);
        touchStartRef.current = null;
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
