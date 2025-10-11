import { Calendar } from 'lucide-react';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useBookings } from '@/hooks/useBookings';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { ProfileEventCard } from '@/components/ProfileEventCard';

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  currentUserId?: string;
  viewerRole?: 'organizer' | 'musician'; // Add viewer role to determine data source
  isOwnProfile?: boolean;
}

export const WorkingEventsDisplay = ({ profile, currentUserId, viewerRole, isOwnProfile: isOwnProfileProp }: WorkingEventsDisplayProps) => {
  const { t } = useAppTranslation();
  
  // Determine which data source to use based on viewer role and ownership
  const isOwnProfile = isOwnProfileProp !== undefined ? isOwnProfileProp : (currentUserId === profile.user_id);
  const isMusicianViewing = viewerRole === 'musician' && !isOwnProfile;
  
  // Use different data sources based on the viewing context
  const { bookings, loading: bookingsLoading } = useBookings(isMusicianViewing ? undefined : profile.user_id);
  const { events: publicEvents, loading: publicLoading } = usePublicEvents(isMusicianViewing ? profile.user_id : '');
  
  // Select the appropriate data source
  const loading = isMusicianViewing ? publicLoading : bookingsLoading;
  const eventsData = isMusicianViewing ? publicEvents : bookings.filter(b => b.status === 'upcoming');

  console.log('🎭 WorkingEventsDisplay render:', {
    isOwnProfile,
    isMusicianViewing,
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
          {isMusicianViewing 
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