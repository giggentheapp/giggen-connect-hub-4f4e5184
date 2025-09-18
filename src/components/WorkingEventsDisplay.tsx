import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useBookings } from '@/hooks/useBookings';

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

interface WorkingEventsDisplayProps {
  profile: UserProfile;
  showSensitiveInfo: boolean; // true for own profile, false for others
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo }: WorkingEventsDisplayProps) => {
  // COPY THE EXACT WORKING CODE FROM BOOKINGS SECTION
  const { bookings, loading } = useBookings(profile.user_id);
  
  // COPY THE EXACT WORKING FILTER
  const upcomingEvents = bookings.filter(b => b.status === 'upcoming');

  console.log('🎯 WorkingEventsDisplay: Found', upcomingEvents.length, 'upcoming events for', profile.user_id);
  console.log('🎯 WorkingEventsDisplay: showSensitiveInfo =', showSensitiveInfo);

  const EventCard = ({ event }: { event: any }) => {
    // Format date display
    const eventDate = event.event_date;
    const eventTime = event.time;
    const displayDate = eventDate ? (
      eventTime && !eventDate.includes('T') ? 
        `${format(new Date(eventDate), 'dd.MM.yyyy')} ${eventTime.slice(0, 5)}` :
        format(new Date(eventDate), 'dd.MM.yyyy HH:mm')
    ) : 'Dato ikke satt';

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription>
                {event.description && (
                  <span className="block text-sm">{event.description}</span>
                )}
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Kommende
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{displayDate}</span>
            </div>
            
            {event.venue && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
              </div>
            )}
            
            {event.price_ticket && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Billett: {event.price_ticket}</span>
              </div>
            )}

            {event.audience_estimate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Forventet publikum: {event.audience_estimate}</span>
              </div>
            )}

            {/* ONLY SHOW SENSITIVE INFO FOR OWN PROFILE */}
            {showSensitiveInfo && (
              <>
                {event.price_musician && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Musiker: {event.price_musician}</span>
                  </div>
                )}
                {event.artist_fee && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Honorar: {event.artist_fee} kr</span>
                  </div>
                )}
                {event.personal_message && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>Melding:</strong> {event.personal_message}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Laster arrangementer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Information */}
      {showSensitiveInfo ? (
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Personvern:</strong> Kun offentlig arrangementinfo vises til andre brukere. 
            Sensitive detaljer som honorar og kontaktinfo er kun synlig for deg og samarbeidspartneren.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Viser kun offentlig arrangementinfo. Sensitive detaljer er ikke tilgjengelig.
          </p>
        </div>
      )}

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {showSensitiveInfo ? 
                'Du har ingen kommende arrangementer' : 
                'Ingen kommende arrangementer for øyeblikket'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};