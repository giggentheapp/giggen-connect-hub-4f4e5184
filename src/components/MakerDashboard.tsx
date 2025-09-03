import { useState } from 'react';
import { GoerView } from '@/components/GoerView';
import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';

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
  const [currentMode, setCurrentMode] = useState(profile.current_mode || profile.default_mode || 'maker');

  const handleModeChange = (newMode: string) => {
    setCurrentMode(newMode);
  };

  // Show GoerView if in goer mode
  if (currentMode === 'goer') {
    return <GoerView profile={profile} onModeChange={handleModeChange} />;
  }

  return (
    <UnifiedSidePanel 
      profile={profile}
      onModeChange={handleModeChange}
    />
  );
};