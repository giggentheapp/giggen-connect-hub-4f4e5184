import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavigationProps {
  items: NavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
  centerAction?: {
    icon: LucideIcon;
    onClick: () => void;
    label: string;
  };
  className?: string;
}

export const MobileNavigation = ({
  items,
  activeItem,
  onNavigate,
  centerAction,
  className
}: MobileNavigationProps) => {
  // Split items for center button placement
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2);

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-lg border-t border-border",
        "pb-safe",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Left items */}
        {leftItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {/* Center action button */}
        {centerAction && (
          <motion.button
            className={cn(
              "relative flex-shrink-0 mx-1",
              "h-14 w-14 rounded-full",
              "bg-primary text-primary-foreground",
              "flex items-center justify-center",
              "shadow-lg shadow-primary/30"
            )}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={centerAction.onClick}
            aria-label={centerAction.label}
          >
            <centerAction.icon className="h-7 w-7" />
          </motion.button>
        )}

        {/* Right items */}
        {rightItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavButton = ({ item, isActive, onClick }: NavButtonProps) => {
  const Icon = item.icon;
  
  return (
    <motion.button
      className={cn(
        "relative flex-1 flex flex-col items-center justify-center",
        "py-2 px-1 min-h-[52px]",
        "transition-colors duration-200",
        "-webkit-tap-highlight-color-transparent"
      )}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.div
        className={cn(
          "relative flex items-center justify-center",
          "w-12 h-8 rounded-2xl",
          "transition-colors duration-200"
        )}
        animate={{
          backgroundColor: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent'
        }}
      >
        <Icon 
          className={cn(
            "h-6 w-6 transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground"
          )} 
        />
        
        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
            layoutId="activeIndicator"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </motion.button>
  );
};
