import { useNavigate, useLocation } from 'react-router-dom';
import { User, MapPin, FileText, Lightbulb, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isArtist, isAudience, loading: roleLoading } = useRole();
  const { t } = useAppTranslation();

  // Navigation items based on role
  const getNavigationItems = () => {
    if (isAudience) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' }
      ];
    } else if (isArtist) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard' },
        { id: 'admin-files', label: 'Filer', icon: FileText, path: '/dashboard' },
        { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: '/dashboard' },
        { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/bookings' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' }
      ];
    }
    return [];
  };

  const navItems = getNavigationItems();

  if (roleLoading || navItems.length === 0) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                active 
                  ? 'text-primary bg-accent' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};