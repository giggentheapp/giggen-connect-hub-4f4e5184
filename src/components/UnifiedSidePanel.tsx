import { useState, useEffect, Fragment, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { navigateToAuth, navigateToProfile, getValidSectionFromUrl, getProfileUrl, isValidSection } from '@/lib/navigation';

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
    const userId = profile.user_id?.split('?')[0].split('#')[0].trim();
    return userId || '';
  }, [profile.user_id]);
  
  // For other people's profiles, always show profile section by default
  // For own profile, read from URL or default to dashboard
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (!isOwnProfile) return 'profile';
    // Read section from URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const urlSection = urlParams.get('section');
    if (urlSection && isValidSection(urlSection)) {
      return urlSection;
    }
    return 'dashboard';
  });
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for better UX
  const [exploreType, setExploreType] = useState<'makers' | 'events'>('makers');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useAppTranslation();
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  // Update activeSection when URL changes or location state changes
  useEffect(() => {
    // Guard: Don't process if cleanProfileUserId is not available
    if (!cleanProfileUserId) {
      return;
    }

    const urlSection = searchParams.get('section');
    const stateSection = location.state?.section;
    const section = urlSection || stateSection;
    
    // If viewing someone else's profile, restrict to profile section only
    if (!isOwnProfile) {
      if (section !== 'profile' && activeSection !== 'profile') {
        setActiveSection('profile');
        const profileUrl = getProfileUrl(cleanProfileUserId, 'profile');
        if (profileUrl) {
          navigate(profileUrl, { replace: true });
        }
      }
      return;
    }
    
    // For own profile: if no section specified, default to dashboard
    if (!section && isOwnProfile) {
      // Only navigate if we're not already on dashboard
      if (activeSection !== 'dashboard') {
        setActiveSection('dashboard');
        const dashboardUrl = getProfileUrl(cleanProfileUserId, 'dashboard');
        if (dashboardUrl) {
          navigate(dashboardUrl, { replace: true });
        }
      }
      return;
    }
    
    // If section is specified and valid, update activeSection
    if (section && isValidSection(section) && section !== activeSection) {
      setActiveSection(section);
    } else if (section && !isValidSection(section)) {
      // Invalid section - redirect to dashboard
      setActiveSection('dashboard');
      const dashboardUrl = getProfileUrl(cleanProfileUserId, 'dashboard');
      if (dashboardUrl) {
        navigate(dashboardUrl, { replace: true });
      }
    }
  }, [searchParams, location.state, isOwnProfile, cleanProfileUserId, activeSection, navigate]);

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
      navigateToAuth(navigate, true, 'User signed out');
    }
  };
  const handleNavigation = (section: string) => {
    // Guard: Don't navigate if cleanProfileUserId is not available
    if (!cleanProfileUserId || cleanProfileUserId.trim() === '') {
      console.error('Cannot navigate: cleanProfileUserId is not available');
      toast({
        title: t('error') || 'Error',
        description: 'Cannot navigate: User ID is missing',
        variant: 'destructive'
      });
      return;
    }

    // Validate section
    if (!isValidSection(section)) {
      console.error(`Invalid section: ${section}`);
      return;
    }

    // Clean the currentUserId if provided
    const cleanCurrentUserId = currentUserId?.split('?')[0].split('#')[0].trim();
    
    // If viewing someone else's profile, navigate to own profile with the selected section
    if (!isOwnProfile && cleanCurrentUserId) {
      navigateToProfile(navigate, cleanCurrentUserId, section, false);
      return;
    }
    
    // If on own profile, just change section - always use clean userId
    setActiveSection(section);
    navigateToProfile(navigate, cleanProfileUserId, section, false);
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
        return <DashboardSection profile={profile} onOpenQuickModal={() => setShowQuickModal(true)} />;
      
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

      {/* Mobile Navigation - Industry Standard */}
      {isMobile && (
        <nav className="mobile-nav mobile-safe-bottom">
          <div className="flex items-center justify-around h-16 px-2 mobile-safe-x">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const showPlusButton = item.id === 'profile';
              
              return (
                <Fragment key={item.id}>
                  <motion.button
                    onClick={() => handleNavigation(item.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center',
                      'flex-1 py-2 px-1 min-h-[52px]',
                      'touch-manipulation'
                    )}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      className={cn(
                        'relative flex items-center justify-center',
                        'w-12 h-8 rounded-2xl'
                      )}
                      animate={{
                        backgroundColor: isActive ? 'hsl(var(--primary) / 0.12)' : 'transparent'
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon 
                        className={cn(
                          "h-6 w-6 transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} 
                      />
                    </motion.div>
                    
                    {/* Active indicator pill - Material Design 3 style */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          layoutId="mobileNavIndicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                  
                  {showPlusButton && (
                    <motion.button
                      onClick={() => setShowQuickModal(true)}
                      className={cn(
                        "relative flex-shrink-0 mx-1",
                        "h-14 w-14 rounded-full",
                        "bg-primary text-primary-foreground",
                        "flex items-center justify-center",
                        "shadow-lg shadow-primary/30",
                        "touch-manipulation"
                      )}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      aria-label="Opprett nytt"
                    >
                      <Plus className="h-7 w-7" />
                    </motion.button>
                  )}
                </Fragment>
              );
            })}
          </div>
        </nav>
      )}

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