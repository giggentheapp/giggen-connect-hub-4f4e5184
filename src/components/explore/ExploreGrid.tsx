import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ExploreGridProps {
  children: ReactNode;
  loading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ExploreGrid = ({
  children,
  loading = false,
  emptyIcon,
  emptyTitle = 'Ingen resultater',
  emptyDescription,
}: ExploreGridProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-card rounded-xl overflow-hidden border border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Check if children is empty array
  const childArray = Array.isArray(children) ? children : [children];
  const hasChildren = childArray.some(child => child);

  if (!hasChildren) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-16 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {emptyIcon && (
          <div className="mb-4 text-muted-foreground/40">
            {emptyIcon}
          </div>
        )}
        <p className="text-lg font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
            {emptyDescription}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-3 md:space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
};
