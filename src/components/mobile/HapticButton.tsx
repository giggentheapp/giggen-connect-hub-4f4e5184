import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef, useCallback } from 'react';

interface HapticButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

// Trigger haptic feedback if available
const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy') => {
  if ('vibrate' in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30
    };
    navigator.vibrate(durations[intensity]);
  }
};

export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    haptic = 'light',
    onClick,
    children,
    ...props 
  }, ref) => {
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic !== 'none') {
        triggerHaptic(haptic);
      }
      onClick?.(e);
    }, [haptic, onClick]);

    const variants = {
      default: 'bg-card text-card-foreground border border-border hover:bg-accent',
      primary: 'bg-primary text-primary-foreground shadow-primary hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm min-h-[44px]',
      md: 'h-12 px-6 text-base min-h-[48px]',
      lg: 'h-14 px-8 text-lg min-h-[56px]',
      icon: 'h-12 w-12 min-h-[48px] min-w-[48px]'
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "rounded-xl font-medium",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "-webkit-tap-highlight-color-transparent",
          "touch-manipulation",
          variants[variant],
          sizes[size],
          className
        )}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.1 }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

HapticButton.displayName = 'HapticButton';
