import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Search, Ticket, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNotifications } from '@/hooks/useNotifications';
import giggenLogo from '@/assets/giggen-logo.png';
import { UserProfile } from '@/types/auth';

// Import sections
import { ArtistExploreSection } from '@/components/sections/ArtistExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { AdminFilesSection } from '@/components/sections/AdminFilesSection';
import { AdminConceptsSection } from '@/components/sections/AdminConceptsSection';
import { AdminBandsSection } from '@/components/sections/AdminBandsSection';
import { AdminSettingsSection } from '@/components/sections/AdminSettingsSection';
import { BookingsSection } from '@/components/sections/BookingsSection';
import { TicketsSection } from '@/components/sections/TicketsSection';
import { MenuSection } from '@/components/sections/MenuSection';

interface UnifiedSidePanelProps {
  profile: UserProfile;
  className?: string;
  isOwnProfile?: boolean;
}

export const UnifiedSidePanel = ({
  profile,
  className,
  isOwnProfile = true
}: UnifiedSidePanelProps) => {
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section') || 'profile';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for better UX
  const [exploreType, setExploreType] = useState<'makers' | 'events'>('makers');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useAppTranslation();
  const { unreadCount } = useNotifications();

  // Update activeSection when URL changes
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('signOutError'),
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate('/auth');
    }
  };
  const handleNavigation = (section: string) => {
    setActiveSection(section);
    navigate(`/dashboard?section=${section}`);
  };

  // Unified navigation items - same for all roles
  const getNavigationItems = () => {
    return [{
      id: 'profile',
      label: t('profile'),
      icon: User
    }, {
      id: 'explore',
      label: t('explore'),
      icon: Search
    }, {
      id: 'tickets',
      label: 'Billetter',
      icon: Ticket
    }, {
      id: 'menu',
      label: 'Meny',
      icon: Menu,
      badge: unreadCount > 0 ? unreadCount : undefined
    }];
  };
  const renderActiveSection = () => {
    // All sections available to all users
    switch (activeSection) {
      case 'explore':
        return <ArtistExploreSection profile={profile} />;
      
      case 'profile':
        return <ProfileSection profile={profile} isOwnProfile={isOwnProfile} />;
      
      case 'tickets':
        return <TicketsSection profile={profile} />;
      
      case 'bookings':
        return <BookingsSection profile={profile} />;
      
      case 'menu':
        return <MenuSection profile={profile} />;
      
      case 'admin-files':
        return <AdminFilesSection profile={profile} />;
      
      case 'admin-concepts':
        return <AdminConceptsSection profile={profile} />;
      
      case 'admin-bands':
        return <AdminBandsSection profile={profile} />;
      
      case 'settings':
        return <AdminSettingsSection profile={profile} />;
      
      default:
        return <ProfileSection profile={profile} isOwnProfile={isOwnProfile} />;
    }
  };
  const navItems = getNavigationItems();
  return <div className={cn("flex flex-col", isMobile ? "h-screen max-h-screen" : "min-h-screen", className)}>
      {/* Desktop Sidebar - Sticky collapsed */}
      {!isMobile && <div className="fixed top-0 left-0 z-50 h-full">
          <div className="h-full w-16 bg-card border-r border-border shadow-lg overflow-y-auto">
            {/* Logo */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-center">
                <img 
                  src={giggenLogo} 
                  alt="GIGGEN Logo" 
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return <div key={item.id} className="relative">
                    <button 
                      onClick={() => handleNavigation(item.id)} 
                      className={cn('w-full flex items-center justify-center p-3 rounded-lg transition-colors', isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground')}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground rounded-full">
                        {item.badge}
                      </div>
                    )}
                  </div>;
          })}
            </nav>
          </div>
        </div>}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col", 
        !isMobile ? 'ml-16 overflow-auto' : 'overflow-hidden', 
        isMobile ? 'pb-16' : ''
      )}>
        <div className={cn("flex-1 flex flex-col", isMobile ? "min-h-0 overflow-hidden" : "")}>
          {renderActiveSection()}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return <div key={item.id} className="relative flex-1">
                <button onClick={() => handleNavigation(item.id)} className={cn('flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 w-full', isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                  <Icon className="h-5 w-5" />
                </button>
                {item.badge && (
                  <div className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground rounded-full">
                    {item.badge}
                  </div>
                )}
              </div>;
        })}
          </div>
        </nav>}
    </div>;
};