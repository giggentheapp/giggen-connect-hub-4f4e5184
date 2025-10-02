import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useBookings } from '@/hooks/useBookings';
import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  showSensitiveInfo: boolean; // true for own profile, false for others
  currentUserId?: string; // Add current user ID to determine ownership
  viewerRole?: 'artist' | 'audience'; // Add viewer role to determine data source
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo, currentUserId, viewerRole }: WorkingEventsDisplayProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  
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

  const handleEventClick = (bookingId: string) => {
    console.log('Event clicked - navigating to public view:', bookingId);
    navigate(`/arrangement/${bookingId}`);
  };

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
    <>
      <div className="space-y-4">
        {eventsData.map((event) => {
          const selectedConceptId = (event as any).selected_concept_id;
          return (
            <Card 
              key={event.id} 
              className="overflow-hidden"
            >
              <CardHeader className="pb-3 px-3 md:px-6 py-3 md:py-6">
                <CardTitle className="text-base md:text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {event.event_date && (
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-3 md:px-6 pb-3 md:pb-6">
                <div className="space-y-2">
                  {event.venue && event.venue !== 'Ved avtale' && (
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      {event.venue}
                    </div>
                  )}
                  {event.ticket_price && (
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Banknote className="h-3 w-3 md:h-4 md:w-4" />
                      {event.ticket_price} kr
                    </div>
                  )}
                  {event.audience_estimate && (
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Users className="h-3 w-3 md:h-4 md:w-4" />
                      {event.audience_estimate} personer
                    </div>
                  )}
                  {event.description && (
                    <div className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </div>
                  )}

                  {/* Portfolio Gallery */}
                  {selectedConceptId && (
                    <div className="pt-3 mt-3">
                      <ConceptPortfolioGallery conceptId={selectedConceptId} />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                    Publisert
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    Se detaljer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};