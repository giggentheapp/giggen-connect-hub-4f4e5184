import { useState, useEffect, Fragment, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { User, Search, Ticket, Home, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import { UserProfile } from '@/types/auth';
import { GlobalQuickActionButton } from '@/components/GlobalQuickActionButton';
import { GlobalQuickCreateModal } from '@/components/GlobalQuickCreateModal';
import { FileUploadModal } from '@/components/FileUploadModal';

// Import sections
import { DashboardSection } from "@/components/sections/DashboardSection";
import { ArtistExploreSection } from "@/components/sections/ArtistExploreSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { AdminFilesSection } from "@/components/sections/AdminFilesSection";
import { AdminConceptsSection } from "@/components/sections/AdminConceptsSection";
import { AdminBandsSection } from "@/components/sections/AdminBandsSection";
import { AdminEventsSection } from "@/components/sections/AdminEventsSection";
import { AdminSettingsSection } from "@/components/sections/AdminSettingsSection";
import { BookingsSection } from "@/components/sections/BookingsSection";
import { TicketsSection } from "@/components/sections/TicketsSection";
import { FileBankSection } from "@/components/sections/FileBankSection";
import { UpcomingEventsSection } from "@/components/sections/UpcomingEventsSection";
import { HistorySection } from "@/components/sections/HistorySection";

interface UnifiedSidePanelProps {
  profile: UserProfile;
  className?: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export const UnifiedSidePanel = ({
  profile,
  className,
  isOwnProfile = true,
  currentUserId
}: UnifiedSidePanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract clean userId from profile - never from URL to avoid corruption
  const cleanProfileUserId = useMemo(() => {
    return profile.user_id?.split('?')[0].split('#')[0].trim();
  }, [profile.user_id]);
  
  // For other people's profiles, always show profile section by default
  const initialSection = isOwnProfile 
    ? (searchParams.get('section') || location.state?.section || 'dashboard')
    : 'profile';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for better UX
  const [exploreType, setExploreType] = useState<'makers' | 'events'>('makers');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useAppTranslation();
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  // Update activeSection when URL changes or location state changes
  useEffect(() => {
    const section = searchParams.get('section') || location.state?.section;
    // If viewing someone else's profile, restrict to profile section only
    if (!isOwnProfile) {
      if (section !== 'profile') {
        setActiveSection('profile');
        // Update URL to reflect profile section - use clean userId
        navigate(`/profile/${cleanProfileUserId}?section=profile`, { replace: true });
      }
      return;
    }
    
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams, location.state, isOwnProfile, cleanProfileUserId]);

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
    // Clean the currentUserId if provided
    const cleanCurrentUserId = currentUserId?.split('?')[0].split('#')[0].trim();
    
    // If viewing someone else's profile, navigate to own profile with the selected section
    if (!isOwnProfile && cleanCurrentUserId) {
      navigate(`/profile/${cleanCurrentUserId}?section=${section}`);
      return;
    }
    
    // If on own profile, just change section - always use clean userId
    setActiveSection(section);
    navigate(`/profile/${cleanProfileUserId}?section=${section}`);
  };

  // Unified navigation items - always show full navigation
  // When viewing someone else's profile, clicking nav items will take you to your own profile
  const getNavigationItems = () => {
    return [{
      id: 'dashboard',
      label: 'Hjem',
      icon: Home
    }, {
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
    }];
  };
  const renderActiveSection = () => {
    // CRITICAL SECURITY: If viewing someone else's profile, only allow profile section
    if (!isOwnProfile) {
      return <ProfileSection profile={profile} isOwnProfile={false} />;
    }
    
    // Full access for own profile
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection profile={profile} />;
      
      case 'explore':
        return <ArtistExploreSection profile={profile} />;
      
      case 'profile':
        return <ProfileSection profile={profile} isOwnProfile={true} />;
      
      case 'tickets':
        return <TicketsSection profile={profile} />;
      
      case 'bookings':
        return <BookingsSection profile={profile} />;
      
      case 'upcoming-events':
        return <UpcomingEventsSection profile={profile} />;
      
      case 'history':
        return <HistorySection profile={profile} />;
      
      case 'admin-files':
        return <AdminFilesSection profile={profile} />;
      
      case 'filbank':
        return <FileBankSection profile={profile} />;
      
      case 'admin-concepts':
        return <AdminConceptsSection profile={profile} />;
      
      case 'admin-bands':
        return <AdminBandsSection profile={profile} />;
      
      case 'admin-events':
        return <AdminEventsSection profile={profile} />;
      
      case 'settings':
        return <AdminSettingsSection profile={profile} />;
      
      default:
        return <ProfileSection profile={profile} isOwnProfile={true} />;
    }
  };
  const navItems = getNavigationItems();
  return <div className={cn("flex flex-col", isMobile ? "h-screen max-h-screen" : "min-h-screen", className)}>
      {/* Desktop Sidebar - Sticky collapsed */}
      {!isMobile && <div className="fixed top-0 left-0 z-50 h-full">
          <div className="h-full w-[60px] bg-white dark:bg-card border-r border-border shadow-lg overflow-y-auto flex flex-col items-center justify-between py-6">
            {/* Logo - Top */}
            <div className="flex flex-col items-center">
              <img 
                src={giggenLogo} 
                alt="Giggen Logo" 
                className="w-10 h-10 object-contain mb-4"
              />

              {/* Top Navigation: Home, Profil, Utforsk */}
              <nav className="w-full flex flex-col items-center space-y-2">
                {navItems
                  .filter(item => item.id !== 'tickets')
                  .map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <div key={item.id} className="relative">
                        <button 
                          onClick={() => handleNavigation(item.id)} 
                          className={cn(
                            'w-12 h-12 flex items-center justify-center rounded-xl p-3 transition-all',
                            isActive 
                              ? 'bg-orange-500/15 text-orange-500' 
                              : 'text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500'
                          )}
                          title={item.label}
                        >
                          <Icon className="h-6 w-6" />
                        </button>
                      </div>
                    );
                  })}
              </nav>
            </div>

            {/* Global CTA Button - Pluss-knapp (midt) */}
            <GlobalQuickActionButton onClick={() => setShowQuickModal(true)} />

            {/* Bottom Navigation: Billetter */}
            <nav className="w-full flex flex-col items-center">
              {navItems
                .filter(item => item.id === 'tickets')
                .map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <div key={item.id} className="relative">
                      <button 
                        onClick={() => handleNavigation(item.id)} 
                        className={cn(
                          'w-12 h-12 flex items-center justify-center rounded-xl p-3 transition-all',
                          isActive 
                            ? 'bg-orange-500/15 text-orange-500' 
                            : 'text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500'
                        )}
                        title={item.label}
                      >
                        <Icon className="h-6 w-6" />
                      </button>
                    </div>
                  );
                })}
            </nav>
          </div>
        </div>}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col", 
        !isMobile ? 'ml-[60px] overflow-auto' : 'overflow-hidden', 
        isMobile ? 'pb-16' : ''
      )}>
        <div className={cn("flex-1 flex flex-col", isMobile ? "min-h-0 overflow-hidden" : "")}>
          {renderActiveSection()}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const showPlusButton = item.id === 'profile';
          
          return (
            <Fragment key={item.id}>
              <div className="relative flex-1">
                <button onClick={() => handleNavigation(item.id)} className={cn('flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 w-full', isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                  <Icon className="h-5 w-5" />
                </button>
              </div>
              {showPlusButton && (
                <div className="relative flex-shrink-0 mx-1">
                  <button
                    onClick={() => setShowQuickModal(true)}
                    className="h-12 w-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition"
                    title="Opprett nytt"
                    aria-label="Opprett nytt"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              )}
            </Fragment>
          );
        })}
          </div>
        </nav>}

      {/* Modals */}
      <GlobalQuickCreateModal
        open={showQuickModal}
        onOpenChange={setShowQuickModal}
        onFilbankUpload={() => setShowFileUploadModal(true)}
        userId={profile.user_id}
      />

      <FileUploadModal
        open={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onUploadComplete={() => {
          setShowFileUploadModal(false);
        }}
        userId={profile.user_id}
      />
    </div>;
};