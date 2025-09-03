import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { MapBackground } from '@/components/MapBackground';

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

interface GoerViewProps {
  profile: UserProfile;
  onModeChange?: (newMode: string) => void;
}

export const GoerView = ({ profile, onModeChange }: GoerViewProps) => {
  console.log('🎯 GoerView initialized with profile:', profile);

  // Create map component for reuse
  const mapComponent = <MapBackground userId={profile.user_id} />;

  return (
    <UnifiedSidePanel 
      profile={profile}
      onModeChange={onModeChange}
      mapComponent={mapComponent}
    />
  );
};