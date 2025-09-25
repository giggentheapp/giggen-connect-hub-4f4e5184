import { MinimalBookingTest } from '@/components/MinimalBookingTest';

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

interface BookingsSectionProps {
  profile: UserProfile;
}

export const BookingsSection = ({ profile }: BookingsSectionProps) => {
  console.log('🔄 BookingsSection rendering safely for user:', profile.user_id);
  
  // Use minimal test first to ensure no crashes
  return <MinimalBookingTest profile={profile} />;
};