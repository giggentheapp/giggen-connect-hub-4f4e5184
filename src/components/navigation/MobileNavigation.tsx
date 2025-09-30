import { cn } from '@/lib/utils';
import { User, Settings, MapPin, Briefcase, FileText, Lightbulb } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate, useLocation } from 'react-router-dom';

export const MobileNavigation = () => {
  const { t } = useAppTranslation();
  const { isArtist, isAudience } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active section based on current route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/booking')) return 'bookings';
    if (path.includes('/concept')) return 'admin-concepts';
    if (path === '/dashboard') return 'explore';
    if (path.includes('/settings')) return 'settings';
    return 'profile';
  };

  const activeSection = getActiveSection();

  // Role-based navigation items
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
        { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/dashboard' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' }
      ];
    }
    return [];
  };

  const navItems = getNavigationItems();

  const handleNavigation = (item: typeof navItems[0]) => {
    // Navigate to dashboard and let UnifiedSidePanel handle section changes
    navigate('/dashboard');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all min-w-0 flex-1',
                'active:scale-95',
                isActive 
                  ? 'text-primary bg-accent' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};