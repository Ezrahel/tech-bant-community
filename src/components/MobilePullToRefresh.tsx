import React, { useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

interface MobilePullToRefreshProps {
  children: React.ReactNode;
}

const TRIGGER_DISTANCE = 88;
const MAX_PULL = 116;

const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({ children }) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isMobileViewport = () => window.innerWidth < 1024;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport() || window.scrollY > 0 || refreshing) return;
    setStartY(event.touches[0]?.clientY ?? null);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (startY === null || !isMobileViewport() || window.scrollY > 0 || refreshing) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = currentY - startY;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    const nextDistance = Math.min(MAX_PULL, delta * 0.55);
    setPullDistance(nextDistance);
  };

  const handleTouchEnd = () => {
    if (!isMobileViewport() || refreshing) {
      setStartY(null);
      setPullDistance(0);
      return;
    }

    if (pullDistance >= TRIGGER_DISTANCE) {
      setRefreshing(true);
      setPullDistance(TRIGGER_DISTANCE);
      window.location.reload();
      return;
    }

    setStartY(null);
    setPullDistance(0);
  };

  const indicatorLabel = useMemo(() => {
    if (refreshing) return 'Refreshing...';
    if (pullDistance >= TRIGGER_DISTANCE) return 'Release to refresh';
    return 'Pull to refresh';
  }, [pullDistance, refreshing]);

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className={`pointer-events-none fixed left-1/2 top-[4.5rem] z-40 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl transition-all duration-200 lg:hidden ${
          pullDistance > 0 || refreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateX(-50%) translateY(${Math.max(-12, pullDistance - 26)}px)`,
        }}
      >
        <span className="inline-flex items-center gap-2">
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {indicatorLabel}
        </span>
      </div>

      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobilePullToRefresh;
