import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120
}: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    scrollTop.current = target.scrollTop;
    
    // Only enable pull-to-refresh when at top of scroll
    if (scrollTop.current <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) {
      setPullDistance(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make it feel natural
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold / 2); // Keep some pull for spinner visibility
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
};
