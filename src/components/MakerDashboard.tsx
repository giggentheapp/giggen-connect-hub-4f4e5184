import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { ExploreSection } from '@/components/sections/ExploreSection';
import { ProfileSection } from '@/components/sections/ProfileSection';
import { AdminSection } from '@/components/sections/AdminSection';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  created_at: string;
  updated_at: string;
}

interface MakerDashboardProps {
  profile: UserProfile;
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  const [activeSection, setActiveSection] = useState('explore');
  const isMobile = useIsMobile();

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'explore':
        return <ExploreSection />;
      case 'profile':
        return <ProfileSection profile={profile} />;
      case 'admin':
        return <AdminSection profile={profile} />;
      default:
        return <ExploreSection />;
    }
  };

  return (
    <div className={`flex h-full ${isMobile ? 'pb-16' : ''}`}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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