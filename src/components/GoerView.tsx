import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { UserProfile } from '@/types/auth';

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