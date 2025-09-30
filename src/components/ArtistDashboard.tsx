import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { UserProfile } from '@/types/auth';

interface ArtistDashboardProps {
  profile: UserProfile;
}

export const ArtistDashboard = ({ profile }: ArtistDashboardProps) => {
  return (
    <UnifiedSidePanel 
      profile={profile}
    />
  );
};