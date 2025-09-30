import { Settings } from '@/pages/Settings';
import { UserProfile } from '@/types/auth';

interface AdminSettingsSectionProps {
  profile: UserProfile;
}

export const AdminSettingsSection = ({ profile }: AdminSettingsSectionProps) => {
  return (
    <div className="w-full">
      {/* Settings component already includes UserSettings internally - no need to duplicate */}
      <Settings />
    </div>
  );
};