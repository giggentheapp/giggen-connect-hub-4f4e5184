import { useNavigate, useLocation } from 'react-router-dom';
import { User, MapPin, FileText, Lightbulb, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';

export const DesktopSidebar = () => {
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
    <div className="hidden md:block fixed top-0 left-0 z-50 h-full">
      <div className="h-full w-16 bg-card border-r border-border shadow-lg overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center">
            <img 
              src={giggenLogo} 
              alt="GIGGEN Logo" 
              className="w-10 h-10 object-contain drop-shadow-lg cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <div key={item.id}>
                <button 
                  onClick={() => navigate(item.path)} 
                  className={cn(
                    'w-full flex items-center justify-center p-3 rounded-lg transition-colors',
                    active 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
