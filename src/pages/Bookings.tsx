import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, MapPin, Settings, Briefcase, FileText, Lightbulb } from 'lucide-react';
import { BookingsSection } from '@/components/sections/BookingsSection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import { cn } from '@/lib/utils';

const Bookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { isOrganizer, isMusician } = useRole();
  const { t } = useAppTranslation();

  const getNavigationItems = () => {
    if (isMusician) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
      ];
    } else if (isOrganizer) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
        { id: 'admin-files', label: 'Filer', icon: FileText, path: '/dashboard?section=admin-files' },
        { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: '/dashboard?section=admin-concepts' },
        { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/dashboard?section=bookings' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
      ];
    }
    return [];
  };

  const navItems = getNavigationItems();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load user profile',
            variant: 'destructive',
          });
          return;
        }

        setCurrentUser(profile);
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view bookings</p>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Button>
                <h1 className="text-lg font-semibold">Bookinger</h1>
                <div className="w-20"></div> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="max-w-6xl mx-auto">
              <BookingsSection profile={currentUser} />
            </div>
          </div>
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
};

export default Bookings;