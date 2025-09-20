import { useState } from 'react';
import { UserSettings } from '@/components/UserSettings';
// Mapbox settings removed - simplified admin section

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

  const handleProfileUpdate = (newProfile: UserProfile) => {
    setUpdatedProfile(newProfile);
    // Trigger real-time update by broadcasting the change
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: newProfile }));
  };

  return (
    <div className="space-y-6">
      {/* Temporarily disabled Mapbox initialization to prevent blocking modal */}
      {/* 
      <MapboxConfigInitializer 
        accessToken="pk.eyJ1IjoiZ2lnZ2VudGhlYXBwIiwiYSI6ImNtZmNiem5qNjF4bDgyanFzNjRlMnZsc3MifQ.pdpTiiX4bL8K_dF6PKxQvA"
        styleUrl="mapbox://styles/giggentheapp/cmdc04yqm004m01qzbafib4fl"
        userId={updatedProfile.user_id}
      />
      */}
      <UserSettings 
        profile={updatedProfile}
        onProfileUpdate={handleProfileUpdate}
      />
      {/* Mapbox settings card removed as requested */}
    </div>
  );
};