import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  className,
  disabled = false 
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120
  });

  const progress = Math.min(pullDistance / 80, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none"
        style={{ top: pullDistance > 0 ? pullDistance - 40 : -40 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: showIndicator ? 1 : 0,
          scale: showIndicator ? 1 : 0.5
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-card border border-border rounded-full p-2 shadow-lg">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : progress * 180 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0 }}
          >
            <RefreshCw 
              className={cn(
                "h-5 w-5 transition-colors",
                progress >= 1 || isRefreshing ? "text-primary" : "text-muted-foreground"
              )} 
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div
        className="touch-pan-x touch-pan-y"
        style={{ transform: `translateY(${pullDistance}px)` }}
        {...handlers}
      >
        {children}
      </motion.div>
    </div>
  );
};
