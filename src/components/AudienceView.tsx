import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { UserProfile } from '@/types/auth';

interface AudienceViewProps {
  profile: UserProfile;
}

export const AudienceView = ({ profile }: AudienceViewProps) => {
  return (
    <UnifiedSidePanel 
      profile={profile}
    />
  );
};