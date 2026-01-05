import { useState, useCallback, useRef } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

interface UseSwipeGestureReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  swipeOffset: { x: number; y: number };
  isSwiping: boolean;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventScrollOnSwipe = false
}: UseSwipeGestureOptions): UseSwipeGestureReturn => {
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  
  const startPos = useRef({ x: 0, y: 0 });
  const direction = useRef<'horizontal' | 'vertical' | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    direction.current = null;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;

    const deltaX = e.touches[0].clientX - startPos.current.x;
    const deltaY = e.touches[0].clientY - startPos.current.y;

    // Determine swipe direction on first significant move
    if (!direction.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        direction.current = 'horizontal';
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        direction.current = 'vertical';
      }
    }

    // Prevent scroll if swiping horizontally
    if (preventScrollOnSwipe && direction.current === 'horizontal') {
      e.preventDefault();
    }

    setSwipeOffset({ x: deltaX, y: deltaY });
  }, [isSwiping, preventScrollOnSwipe]);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    const { x, y } = swipeOffset;

    if (direction.current === 'horizontal') {
      if (x < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (x > threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else if (direction.current === 'vertical') {
      if (y < -threshold && onSwipeUp) {
        onSwipeUp();
      } else if (y > threshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    setSwipeOffset({ x: 0, y: 0 });
    setIsSwiping(false);
    direction.current = null;
  }, [isSwiping, swipeOffset, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    swipeOffset,
    isSwiping
  };
};
