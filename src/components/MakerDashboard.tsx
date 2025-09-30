import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'artist' | 'audience';
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
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  return (
    <UnifiedSidePanel 
      profile={profile}
    />
  );
};