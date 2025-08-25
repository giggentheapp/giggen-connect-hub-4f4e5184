import { useState } from 'react';
import { SettingsSection } from '@/components/sections/SettingsSection';

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
  const [updatedProfile, setUpdatedProfile] = useState(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Innstillinger</h1>
        <p className="text-muted-foreground">Administrer profilinnstillinger og personvern</p>
      </div>

      <SettingsSection 
        profile={updatedProfile} 
        onProfileUpdate={setUpdatedProfile}
      />
    </div>
  );
};