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

interface GoerViewProps {
  profile: UserProfile;
}

export const GoerView = ({ profile }: GoerViewProps) => {
  console.log('🎯 GoerView initialized with profile:', profile);

  return (
    <UnifiedSidePanel 
      profile={profile}
    />
  );
};