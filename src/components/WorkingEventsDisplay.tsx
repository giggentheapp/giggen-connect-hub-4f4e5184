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
  const { bookings, loading } = useBookings(profile.user_id);
  const publishedEvents = bookings.filter(b => b.status === 'upcoming');

  // Debug logging to check what data we're getting
  console.log('WorkingEventsDisplay DEBUG:');
  console.log('Profile user_id:', profile.user_id);
  console.log('Profile display_name:', profile.display_name);
  console.log('All bookings:', bookings);
  console.log('Published events (status=upcoming):', publishedEvents);
  console.log('Loading state:', loading);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  if (publishedEvents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">No upcoming events</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publishedEvents.map((event) => (
        <Card key={event.id} className="p-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription>
              {event.event_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), 'MMM d, yyyy')}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {event.venue && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </div>
              )}
              {event.ticket_price && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  {event.ticket_price} kr
                </div>
              )}
              {event.description && (
                <div className="text-sm text-muted-foreground">
                  {event.description}
                </div>
              )}
            </div>
            <div className="mt-3">
              <Badge variant="secondary">{event.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};