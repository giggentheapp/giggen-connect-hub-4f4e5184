import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { DesktopMenubar } from '@/components/navigation/DesktopMenubar';
import { ExploreSection } from '@/components/sections/ExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { ProfileGoerSection } from '@/components/sections/ProfileGoerSection';
import { UpcomingEventsSection } from '@/components/sections/UpcomingEventsSection';
import { AdminFilesSection } from '@/components/sections/AdminFilesSection';
import { AdminConceptsSection } from '@/components/sections/AdminConceptsSection';
import { AdminSettingsSection } from '@/components/sections/AdminSettingsSection';
import { BookingsSection } from '@/components/sections/BookingsSection';
import { Button } from '@/components/ui/button';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { GoerView } from '@/components/GoerView';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface MakerDashboardProps {
  profile: UserProfile;
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  const [activeSection, setActiveSection] = useState('explore');
  const [currentMode, setCurrentMode] = useState(profile.current_mode || profile.default_mode || 'maker');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleModeChange = (newMode: string) => {
    setCurrentMode(newMode);
  };

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

  // Show GoerView if in goer mode
  if (currentMode === 'goer') {
    return <GoerView profile={profile} onModeChange={handleModeChange} />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'explore':
        return <ExploreSection />;
      case 'profile':
      case 'profile-maker':
        return <ProfileSection profile={profile} />;
      case 'profile-goer':
        return <ProfileGoerSection profile={profile} />;
      case 'bookings':
        return <BookingsSection profile={profile} />;
      case 'admin-files':
        return <AdminFilesSection profile={profile} />;
      case 'admin-concepts':
        return <AdminConceptsSection profile={profile} />;
      case 'admin-events':
        return <UpcomingEventsSection profile={profile} isAdminView={true} />;
      case 'admin-settings':
        return <AdminSettingsSection profile={profile} />;
      default:
        return <ExploreSection />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Desktop Menubar */}
      {!isMobile && (
        <DesktopMenubar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}

      {/* Header */}
      <header className={`border-b bg-card/95 backdrop-blur-sm z-40 ${!isMobile ? 'ml-16' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Velkommen, {profile.display_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ModeSwitcher profile={profile} onModeChange={handleModeChange} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logg ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${!isMobile ? 'ml-16' : ''} ${isMobile ? 'pb-16' : ''}`}>
        <div className="container mx-auto px-4 py-6">
          {renderActiveSection()}
        </div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}
    </div>
  );
};