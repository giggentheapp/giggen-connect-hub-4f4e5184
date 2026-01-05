import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  showHandle?: boolean;
}

export const SwipeableDrawer = ({
  open,
  onClose,
  children,
  className,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  showHandle = true
}: SwipeableDrawerProps) => {
  const isMobile = useIsMobile();
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  
  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Quick swipe down - close
    if (velocity > 500) {
      onClose();
      return;
    }
    
    // Slow drag - snap to nearest point or close
    if (offset > 100) {
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(0);
      }
    } else if (offset < -100 && currentSnap < snapPoints.length - 1) {
      setCurrentSnap(currentSnap + 1);
    }
  }, [onClose, currentSnap, snapPoints.length]);

  if (!isMobile) {
    // Desktop fallback - simple modal
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className={cn(
                "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
                "bg-card rounded-lg shadow-xl max-w-lg w-[90%] max-h-[85vh] overflow-auto",
                className
              )}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  const snapHeight = snapPoints[currentSnap] * 100;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 touch-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-card rounded-t-2xl shadow-xl",
              "touch-none",
              className
            )}
            style={{ 
              height: `${snapHeight}vh`,
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            {showHandle && (
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}
            
            {/* Content */}
            <div className="overflow-auto h-full pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
