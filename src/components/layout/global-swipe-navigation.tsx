'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function GlobalSwipeNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwiping, setIsSwiping] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean; decided: boolean } | null>(null);

  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    // Only enable global page swipe navigation if not already on /dashboard
    if (isDashboard) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if a local edge swipe view (e.g. Directorio or Ticket detail drawer) is currently active
      const activeLocalContainer = document.querySelector('[data-ios-edge-swipe="true"]');
      if (activeLocalContainer) {
        // If the local container is visible/rendered, let local swipe handle it instead of full page back
        const rect = activeLocalContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return;
        }
      }

      const touch = e.touches[0];
      if (!touch) return;

      // Generous edge zone: left 90px or 25% of viewport width
      const threshold = Math.max(90, window.innerWidth * 0.25);
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
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.isEdge) return;
      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartRef.current.x;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      if (!touchStartRef.current.decided) {
        if (Math.abs(dx) > 8 || dy > 8) {
          touchStartRef.current.decided = true;
          if (dy > dx * 0.85 || dx <= 0) {
            // Vertical movement or leftward swipe -> cancel
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
        const maxW = window.innerWidth;
        const clampedDx = Math.min(dx, maxW);
        setTranslateX(clampedDx);
        setDragProgress(Math.min(clampedDx / (maxW * 0.4), 1));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.isEdge) {
        setIsSwiping(false);
        setTranslateX(0);
        setDragProgress(0);
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      if (touch) {
        const dx = touch.clientX - touchStartRef.current.x;
        // Trigger back navigation if dragged > 65px
        if (dx >= 65) {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/dashboard');
          }
        }
      }

      setIsSwiping(false);
      setTranslateX(0);
      setDragProgress(0);
      touchStartRef.current = null;
    };

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
  }, [isDashboard, pathname, router]);

  if (isDashboard || !isSwiping || translateX <= 10) {
    return null;
  }

  return (
    <div
      className="lg:hidden fixed left-2.5 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-[#0B172D]/90 backdrop-blur-md text-white flex items-center justify-center pointer-events-none shadow-2xl transition-opacity"
      style={{
        opacity: Math.min(dragProgress * 1.5, 1),
        transform: `translateY(-50%) translateX(${Math.min(translateX * 0.25, 25)}px)`,
      }}
    >
      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
    </div>
  );
}
