import { Calendar } from 'lucide-react';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { ProfileEventCard } from '@/components/ProfileEventCard';

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  currentUserId?: string;
  isOwnProfile?: boolean;
}

export const WorkingEventsDisplay = ({ profile, currentUserId, isOwnProfile: isOwnProfileProp }: WorkingEventsDisplayProps) => {
  const { t } = useAppTranslation();
  
  // Determine ownership - all users see the same view
  const isOwnProfile = isOwnProfileProp !== undefined ? isOwnProfileProp : (currentUserId === profile.user_id);
  
  // Always show public events for this profile
  const { events: publicEvents, loading } = usePublicEvents(profile.user_id);

  console.log('🎭 WorkingEventsDisplay render:', {
    isOwnProfile,
    profileId: profile.user_id,
    eventsCount: publicEvents.length,
    loading
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Laster arrangementer...</p>
      </div>
    );
  }

  if (publicEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isOwnProfile ? 'Du har ingen publiserte arrangementer' : 'Ingen publiserte arrangementer'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {publicEvents.map((event) => (
        <ProfileEventCard key={event.id} event={event} />
      ))}
    </div>
  );
};