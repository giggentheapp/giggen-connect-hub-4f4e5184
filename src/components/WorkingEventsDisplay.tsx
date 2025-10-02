import { Calendar } from 'lucide-react';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useBookings } from '@/hooks/useBookings';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { ProfileEventCard } from '@/components/ProfileEventCard';

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  showSensitiveInfo: boolean; // true for own profile, false for others
  currentUserId?: string; // Add current user ID to determine ownership
  viewerRole?: 'artist' | 'audience'; // Add viewer role to determine data source
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo, currentUserId, viewerRole }: WorkingEventsDisplayProps) => {
  const { t } = useAppTranslation();
  
  // Determine which data source to use based on viewer role and ownership
  const isOwnProfile = currentUserId === profile.user_id;
  const isAudienceViewing = viewerRole === 'audience' && !isOwnProfile;
  
  // Use different data sources based on the viewing context
  const { bookings, loading: bookingsLoading } = useBookings(isAudienceViewing ? undefined : profile.user_id);
  const { events: publicEvents, loading: publicLoading } = usePublicEvents(isAudienceViewing ? profile.user_id : '');
  
  // Select the appropriate data source
  const loading = isAudienceViewing ? publicLoading : bookingsLoading;
  const eventsData = isAudienceViewing ? publicEvents : bookings.filter(b => b.status === 'upcoming');

  console.log('🎭 WorkingEventsDisplay render:', {
    isOwnProfile,
    isAudienceViewing,
    viewerRole,
    eventsCount: eventsData.length,
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

  if (eventsData.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isAudienceViewing 
            ? 'Ingen publiserte arrangementer for øyeblikket'
            : (isOwnProfile ? 'Du har ingen publiserte arrangementer' : 'Ingen publiserte arrangementer')
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {eventsData.map((event) => (
        <ProfileEventCard key={event.id} event={event} />
      ))}
    </div>
  );
};