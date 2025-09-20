import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Banknote, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { useBookings } from '@/hooks/useBookings';
import { BookingDetailsModal } from '@/components/BookingDetailsModal';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  currentUserId?: string; // Add current user ID to determine ownership
  viewerRole?: 'maker' | 'goer'; // Add viewer role to determine data source
}

export const WorkingEventsDisplay = ({ profile, showSensitiveInfo, currentUserId, viewerRole }: WorkingEventsDisplayProps) => {
  // Determine which data source to use based on viewer role and ownership
  const isOwnProfile = currentUserId === profile.user_id;
  const isGoerViewing = viewerRole === 'goer' && !isOwnProfile;
  
  // Use different data sources based on the viewing context
  const { bookings, loading: bookingsLoading } = useBookings(isGoerViewing ? undefined : profile.user_id);
  const { events: publicEvents, loading: publicLoading } = usePublicEvents(isGoerViewing ? profile.user_id : '');
  
  // Select the appropriate data source
  const loading = isGoerViewing ? publicLoading : bookingsLoading;
  const eventsData = isGoerViewing ? publicEvents : bookings.filter(b => b.status === 'upcoming');
  
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('🎭 WorkingEventsDisplay render:', {
    isOwnProfile,
    isGoerViewing,
    viewerRole,
    eventsCount: eventsData.length,
    loading
  });

  const handleEventClick = (bookingId: string) => {
    console.log('Event clicked:', bookingId);
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBookingId(null);
  };

  // Determine if current user is owner of the booking
  const isBookingOwner = (booking: any) => {
    if (!currentUserId) return false;
    return booking.sender_id === currentUserId || booking.receiver_id === currentUserId;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  if (eventsData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {isGoerViewing ? "Ingen offentlige arrangementer" : "No upcoming events"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {eventsData.map((event) => (
          <Card 
            key={event.id} 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleEventClick(event.id)}
          >
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
                {event.venue && event.venue !== 'Ved avtale' && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {event.venue}
                  </div>
                )}
                {event.ticket_price && (
                  <div className="flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4" />
                    {event.ticket_price} kr
                  </div>
                )}
                {event.audience_estimate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    {event.audience_estimate} personer
                  </div>
                )}
                {event.description && (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary">{event.status}</Badge>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Se detaljer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        bookingId={selectedBookingId}
        currentUserId={currentUserId}
        isOwner={selectedBookingId ? isBookingOwner(eventsData.find(e => e.id === selectedBookingId)) : false}
      />
    </>
  );
};