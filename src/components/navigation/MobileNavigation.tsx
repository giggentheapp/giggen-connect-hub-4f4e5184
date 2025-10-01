import { cn } from '@/lib/utils';
import { Compass, User, Settings, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';

type NavigationRoute = {
  id: string;
  label: string;
  icon: typeof Compass;
  path: string;
  section?: string;
};

export const MobileNavigation = () => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: NavigationRoute[] = [
    { 
      id: 'explore', 
      label: t('explore'), 
      icon: Compass,
      path: '/',
      section: 'explore'
    },
    { 
      id: 'profile', 
      label: t('profile'), 
      icon: User,
      path: '/',
      section: 'profile'
    },
    { 
      id: 'bookings', 
      label: t('bookings'), 
      icon: Calendar,
      path: '/',
      section: 'bookings'
    },
    { 
      id: 'admin', 
      label: t('administration'), 
      icon: Settings,
      path: '/',
      section: 'admin'
    },
  ];

  const getCurrentSection = () => {
    const params = new URLSearchParams(location.search);
    return params.get('section') || 'explore';
  };

  const handleNavigation = (item: NavigationRoute) => {
    if (item.section) {
      navigate(`${item.path}?section=${item.section}`);
    } else {
      navigate(item.path);
    }
  };

  const currentSection = getCurrentSection();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
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