import { cn } from '@/lib/utils';
import { Home, Calendar, Music, User, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export const MobileNavigation = () => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'dashboard', label: t('dashboard') || 'Hjem', icon: Home, path: '/dashboard' },
    { id: 'bookings', label: t('bookings') || 'Bookings', icon: Calendar, path: '/bookings' },
    { id: 'events', label: t('events') || 'Events', icon: Music, path: '/events' },
    { id: 'profile', label: t('profile') || 'Profil', icon: User, path: '/profile' },
    { id: 'settings', label: t('settings') || 'Innstillinger', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1',
                'active:scale-95',
                active 
                  ? 'text-primary bg-accent scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform',
                active && 'scale-110'
              )} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};