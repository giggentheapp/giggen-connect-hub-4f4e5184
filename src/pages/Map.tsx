import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleProvider';
import { User, MapPin, Settings, Briefcase, FileText, Lightbulb } from 'lucide-react';
import giggenLogo from '@/assets/giggen-logo.png';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getProfileUrl } from '@/lib/navigation';

export default function Map() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const isMobile = useIsMobile();
  const { user } = useCurrentUser();

  const getNavigationItems = () => {
    const userId = user?.id;
    if (!userId) {
      // Return paths that redirect to auth if not logged in
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
        { id: 'admin-files', label: 'Filer', icon: FileText, path: '/dashboard?section=admin-files' },
        { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: '/dashboard?section=admin-concepts' },
        { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/dashboard?section=bookings' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
      ];
    }
    return [
      { id: 'profile', label: t('profile'), icon: User, path: getProfileUrl(userId, 'profile') },
      { id: 'explore', label: t('explore'), icon: MapPin, path: getProfileUrl(userId, 'explore') },
      { id: 'admin-files', label: 'Filer', icon: FileText, path: getProfileUrl(userId, 'admin-files') },
      { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: getProfileUrl(userId, 'admin-concepts') },
      { id: 'bookings', label: t('bookings'), icon: Briefcase, path: getProfileUrl(userId, 'bookings') },
      { id: 'settings', label: t('settings'), icon: Settings, path: getProfileUrl(userId, 'settings') }
    ];
  };

  const navItems = getNavigationItems();

  return (
    <div className="relative min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed top-0 left-0 z-50 h-full">
          <div className="h-full w-16 bg-card border-r border-border shadow-lg overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-center">
                <img 
                  src={giggenLogo} 
                  alt="GIGGEN Logo" 
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => navigate(item.path)} 
                      className={cn(
                        'w-full flex items-center justify-center p-3 rounded-lg transition-colors',
                        'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
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
      )}

      {/* Main Content */}
      <main className={cn("flex-1", !isMobile ? 'ml-16' : '', isMobile ? 'pb-20' : 'pb-6')}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          {/* Minimal content - feedback button is automatically included from App.tsx */}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button 
                  key={item.id} 
                  onClick={() => navigate(item.path)} 
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                    'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}