import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  Compass, User, Settings, Calendar, FolderOpen, 
  LogOut, Search, MapPin, Users, Home, List
} from 'lucide-react';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import sections
import { ExploreSection } from '@/components/sections/ExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { ProfileGoerSection } from '@/components/sections/ProfileGoerSection';
import { UpcomingEventsSection } from '@/components/sections/UpcomingEventsSection';
import { AdminFilesSection } from '@/components/sections/AdminFilesSection';
import { AdminConceptsSection } from '@/components/sections/AdminConceptsSection';
import { AdminSettingsSection } from '@/components/sections/AdminSettingsSection';
import { BookingsSection } from '@/components/sections/BookingsSection';
import { UserSettings } from '@/components/UserSettings';
import { EventMarket } from '@/components/EventMarket';
import GoerFullscreenMap from '@/components/GoerFullscreenMap';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
  created_at: string;
  updated_at: string;
  default_mode?: string;
  current_mode?: string;
}

interface UnifiedSidePanelProps {
  profile: UserProfile;
  onModeChange?: (newMode: string) => void;
  mapComponent?: ReactNode;
  className?: string;
}

export const UnifiedSidePanel = ({ profile, onModeChange, mapComponent, className }: UnifiedSidePanelProps) => {
  const [activeSection, setActiveSection] = useState('explore');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isMakerInGoerMode = profile.role === 'maker' && onModeChange;
  const currentRole = profile.current_mode || profile.default_mode || profile.role;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    if (currentRole === 'goer') {
      return [
        { id: 'explore', label: 'Utforsk', icon: Search },
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'event-market', label: 'Event Market', icon: Calendar },
        { id: 'settings', label: 'Innstillinger', icon: Settings },
      ];
    } else {
      return [
        { id: 'explore', label: 'Utforsk', icon: Compass },
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'bookings', label: 'Bookinger', icon: Calendar },
        { id: 'admin-files', label: 'Filer', icon: FolderOpen },
        { id: 'admin-concepts', label: 'Konsepter', icon: Settings },
        { id: 'admin-events', label: 'Arrangementer', icon: Calendar },
        { id: 'settings', label: 'Innstillinger', icon: Settings },
      ];
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'explore':
        if (currentRole === 'goer') {
          // For goer mode, always show full-screen map
          return null; // Map is rendered as background
        } else {
          return <ExploreSection />;
        }
      
      case 'profile':
        if (currentRole === 'goer') {
          return <ProfileGoerSection profile={profile} />;
        } else {
          return <ProfileSection profile={profile} />;
        }
      
      case 'bookings':
        return <BookingsSection profile={profile} />;
      
      case 'admin-files':
        return <AdminFilesSection profile={profile} />;
      
      case 'admin-concepts':
        return <AdminConceptsSection profile={profile} />;
      
      case 'admin-events':
        return <UpcomingEventsSection profile={profile} isAdminView={true} />;
      
      case 'event-market':
        return <EventMarket />;
      
      case 'settings':
        return (
          <div>
            <UserSettings 
              profile={profile}
              onProfileUpdate={(updatedProfile) => {
                console.log('Profile updated:', updatedProfile);
              }}
            />
            
            <div className="mt-8 space-y-6 max-w-2xl">
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="font-semibold mb-4">Konto</h3>
                <div className="space-y-3">
                  {isMakerInGoerMode && (
                    <div className="pb-4 border-b">
                      <ModeSwitcher profile={profile} onModeChange={onModeChange} />
                    </div>
                  )}
                  <Button 
                    onClick={handleSignOut}
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logg ut
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <ExploreSection />;
    }
  };

  const navItems = getNavigationItems();

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Full-screen Map Background for Goer Explore mode */}
      {activeSection === 'explore' && currentRole === 'goer' && mapComponent && (
        <div className="fixed inset-0 z-10">
          {mapComponent}
        </div>
      )}

      {/* Desktop Sidebar - Floating overlay */}
      {!isMobile && (
        <div 
          className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div className={cn(
            "h-full bg-card/95 backdrop-blur-sm border-r border-border shadow-lg transition-all duration-300 overflow-y-auto",
            isExpanded ? "w-64" : "w-16"
          )}>
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                {isExpanded && (
                  <span className="font-bold text-lg text-foreground opacity-0 animate-fade-in">
                    GIGGEN
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="opacity-0 animate-fade-in flex-1">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* ModeSwitcher for Makers in Goer mode */}
              {isMakerInGoerMode && isExpanded && (
                <div className="pt-4 border-t border-border">
                  <ModeSwitcher profile={profile} onModeChange={onModeChange} />
                </div>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-4"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="opacity-0 animate-fade-in flex-1">
                    Logg ut
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        !isMobile ? (activeSection === 'explore' && currentRole === 'goer' ? '' : 'ml-20') : '',
        isMobile ? 'pb-16' : ''
      )}>
        {activeSection === 'explore' && currentRole === 'goer' ? (
          // For goer explore mode, don't render content over the map
          null
        ) : (
          <div className="container mx-auto px-4 py-6">
            {renderActiveSection()}
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                    isActive 
                      ? 'text-primary bg-accent' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};