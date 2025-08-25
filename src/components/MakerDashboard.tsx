import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { DesktopMenubar } from '@/components/navigation/DesktopMenubar';
import { ExploreSection } from '@/components/sections/ExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { AdminSection } from '@/components/sections/AdminSection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface MakerDashboardProps {
  profile: UserProfile;
  onSignOut: () => void;
}

export const MakerDashboard = ({ profile, onSignOut }: MakerDashboardProps) => {
  const [activeSection, setActiveSection] = useState('explore');
  const isMobile = useIsMobile();

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'explore':
        return <ExploreSection />;
      case 'profile':
        return <ProfileSection profile={profile} />;
      case 'admin':
      case 'admin-files':
      case 'admin-concepts':  
      case 'admin-settings':
        return <AdminSection profile={profile} initialTab={activeSection.replace('admin-', '') || 'files'} />;
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

      {/* Header with Sign Out */}
      <header className={cn(
        "border-b bg-card/95 backdrop-blur-sm z-40",
        !isMobile ? "ml-16" : ""
      )}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Velkommen, {profile.display_name}
            </p>
          </div>
          <Button variant="outline" onClick={onSignOut} size="sm">
            Logg ut
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        !isMobile ? "ml-16" : "",
        isMobile ? "pb-16" : ""
      )}>
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