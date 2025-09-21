import { Settings } from '@/pages/Settings';

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
}

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