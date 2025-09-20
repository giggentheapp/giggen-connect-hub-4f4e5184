import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { LeafletMap } from '@/components/LeafletMap';

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

interface GoerViewProps {
  profile: UserProfile;
}

export const GoerView = ({ profile }: GoerViewProps) => {
  console.log('🎯 GoerView initialized with profile:', profile);

  // Create map component for reuse
  const mapComponent = <LeafletMap className="h-full" />;

  return (
    <UnifiedSidePanel 
      profile={profile}
      mapComponent={mapComponent}
    />
  );
};