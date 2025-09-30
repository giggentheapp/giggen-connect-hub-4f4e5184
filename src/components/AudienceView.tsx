import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { UserProfile } from '@/types/auth';

interface AudienceViewProps {
  profile: UserProfile;
}

export const AudienceView = ({ profile }: AudienceViewProps) => {
  console.log('🎯 AudienceView initialized with profile:', profile);

  return (
    <UnifiedSidePanel 
      profile={profile}
    />
  );
};