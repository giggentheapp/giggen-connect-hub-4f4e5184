import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Compass, User, Settings, Calendar, FolderOpen, LogOut, Search, MapPin, Users, Home, List, Lightbulb, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/contexts/RoleProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import sections
import { ExploreSection } from '@/components/sections/ExploreSection';
import { GoerExploreSection } from '@/components/sections/GoerExploreSection';
import { MakerExploreSection } from '@/components/sections/MakerExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { ProfileGoerSection } from '@/components/sections/ProfileGoerSection';
import { UpcomingEventsSection } from '@/components/sections/UpcomingEventsSection';
import { AdminFilesSection } from '@/components/sections/AdminFilesSection';
import { AdminConceptsSection } from '@/components/sections/AdminConceptsSection';
import { AdminSettingsSection } from '@/components/sections/AdminSettingsSection';
import { BookingsSection } from '@/components/sections/BookingsSection';
import { UserSettings } from '@/components/UserSettings';
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
}
interface UnifiedSidePanelProps {
  profile: UserProfile;
  mapComponent?: ReactNode;
  className?: string;
}
export const UnifiedSidePanel = ({
  profile,
  mapComponent,
  className
}: UnifiedSidePanelProps) => {
  const [activeSection, setActiveSection] = useState('explore');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for better UX
  const [exploreType, setExploreType] = useState<'makers' | 'events'>('makers');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    role: userRole,
    ismaker,
    isGoer,
    loading: roleLoading
  } = useRole();

  // Use role from context as single source of truth
  const currentRole = userRole || profile.role;
  const handleSignOut = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive"
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

  // Role-based navigation items - simplified role-specific navigation  
  const getNavigationItems = () => {
    if (isGoer) {
      return [
        {
          id: 'profile',
          label: 'Profil',
          icon: User
        },
        {
          id: 'explore',
          label: 'Utforsk',
          icon: MapPin
        },
        {
          id: 'settings',
          label: 'Innstillinger',
          icon: Settings
        }
      ];
    } else if (ismaker) {
      return [{
        id: 'profile',
        label: 'Profil',
        icon: User
      }, {
        id: 'explore',
        label: 'Utforsk',
        icon: MapPin
      }, {
        id: 'admin-files',
        label: 'Filer',
        icon: FileText
      }, {
        id: 'admin-concepts',
        label: 'Konsepter',
        icon: Lightbulb
      }, {
        id: 'bookings',
        label: 'Booking',
        icon: Briefcase
      }, {
        id: 'settings',
        label: 'Innstillinger',
        icon: Settings
      }];
    }
    return []; // Loading state
  };
  const renderActiveSection = () => {
    // Block content rendering if role loading
    if (roleLoading) {
      return <div className="flex items-center justify-center py-8">Laster...</div>;
    }
    switch (activeSection) {
      case 'explore':
        if (isGoer) {
          return <GoerExploreSection profile={profile} viewMode={viewMode} exploreType={exploreType} />;
        } else if (ismaker) {
          return <MakerExploreSection profile={profile} />;
        }
        return null;
      // Loading state

      case 'profile':
        if (isGoer) {
          return <ProfileGoerSection profile={profile} />;
        } else if (ismaker) {
          return <ProfileSection profile={profile} />;
        }
        return null;
      case 'bookings':
        // Only available to makers
        if (ismaker) {
          return <BookingsSection profile={profile} />;
        }
        return null;
      case 'admin-files':
        // Only available to makers
        if (ismaker) {
          return <AdminFilesSection profile={profile} />;
        }
        return null;
      case 'admin-concepts':
        // Only available to makers
        if (ismaker) {
          return <AdminConceptsSection profile={profile} />;
        }
        return null;
      case 'settings':
        return <AdminSettingsSection profile={profile} />;
      default:
        if (isGoer) {
          return <GoerExploreSection profile={profile} viewMode={viewMode} exploreType={exploreType} />;
        } else if (ismaker) {
          return <MakerExploreSection profile={profile} />;
        }
        return null;
    }
  };
  const navItems = getNavigationItems();
  return <div className={cn("relative min-h-screen", className)}>
      {/* Full-screen Map Background for Goer Explore mode */}
      {activeSection === 'explore' && isGoer && mapComponent && <div className="fixed inset-0 z-10">
          {mapComponent}
        </div>}

      {/* Desktop Sidebar - Floating overlay */}
      {!isMobile && <div className="fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out" onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
          <div className={cn("h-full bg-card/95 backdrop-blur-sm border-r border-border shadow-lg transition-all duration-300 overflow-y-auto", isExpanded ? "w-64" : "w-16")}>
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/d5d195a6-c8a7-4768-b1ac-c6c11fbff212.png" 
                  alt="GIGGEN Logo" 
                  className="w-8 h-8 object-contain"
                />
                {isExpanded && <span className="font-bold text-lg text-foreground opacity-0 animate-fade-in">
                    GIGGEN
                  </span>}
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return <div key={item.id}>
                    <button onClick={() => handleNavigation(item.id)} className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left', isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground')}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isExpanded && <span className="opacity-0 animate-fade-in flex-1">
                          {item.label}
                        </span>}
                    </button>
                  </div>;
          })}

              
              {/* Logout Button */}
              
            </nav>
          </div>
        </div>}

      {/* Main Content */}
      <main className={cn("flex-1 overflow-hidden", !isMobile ? activeSection === 'explore' ? '' : 'ml-20' : '', isMobile ? 'pb-16' : '')}>
        {activeSection === 'explore' && (isGoer || ismaker) ?
      // For explore mode, render content directly without container
      renderActiveSection() : <div className="container mx-auto px-4 py-6 h-full">
            {renderActiveSection()}
          </div>}
      </main>

      {/* Mobile Navigation */}
      {isMobile && <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return <button key={item.id} onClick={() => handleNavigation(item.id)} className={cn('flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1', isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>;
        })}
          </div>
        </nav>}
    </div>;
};