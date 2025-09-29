import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, Send, Clock, Check, RefreshCw } from 'lucide-react';
import { useBookingsSafe, SafeBooking } from '@/hooks/useBookingsSafe';
import { SafeBookingCard } from './SafeBookingCard';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  role: 'maker' | 'goer';
  avatar_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public: boolean;
  contact_info?: any;
}

interface SafeBookingsSectionProps {
  profile: UserProfile;
}

type TabType = 'incoming' | 'sent' | 'ongoing' | 'upcoming';

export const SafeBookingsSection = ({ profile }: SafeBookingsSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const { bookings, loading, error, refetch } = useBookingsSafe(profile.user_id);

  console.log('🎯 SafeBookingsSection render:', { 
    userId: profile.user_id, 
    bookingsCount: bookings.length, 
    loading,
    error 
  });

  // Safe filtering with memoization
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return { incoming: [], sent: [], ongoing: [], upcoming: [] };

    const incoming = bookings.filter(b => 
      b?.receiver_id === profile.user_id && b?.status === 'pending'
    );
    
    const sent = bookings.filter(b => 
      b?.sender_id === profile.user_id && b?.status === 'pending'
    );
    
      const ongoing = bookings.filter(b => 
        (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
        ['allowed', 'approved_by_sender', 'approved_by_receiver', 'approved_by_both', 'both_parties_approved'].includes(b?.status)
      );
    
    const upcoming = bookings.filter(b => 
      (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
      b?.status === 'upcoming'
    );

    return { incoming, sent, ongoing, upcoming };
  }, [bookings, profile.user_id]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Laster bookinger...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">Kunne ikke laste bookinger: {error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Prøv igjen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tab counts
  const tabCounts = {
    incoming: filteredBookings.incoming.length,
    sent: filteredBookings.sent.length,
    ongoing: filteredBookings.ongoing.length,
    upcoming: filteredBookings.upcoming.length,
  };

  // Current tab data
  const currentBookings = filteredBookings[activeTab];

  // Empty state component
  const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
    <Card>
      <CardContent className="text-center py-12">
        <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto pb-2">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('incoming')} 
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Inbox className="h-4 w-4" />
          Innkommende ({tabCounts.incoming})
        </Button>
        
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('sent')} 
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Send className="h-4 w-4" />
          Sendt ({tabCounts.sent})
        </Button>
        
        <Button 
          variant={activeTab === 'ongoing' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('ongoing')} 
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Clock className="h-4 w-4" />
          Pågående ({tabCounts.ongoing})
        </Button>
        
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('upcoming')} 
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Check className="h-4 w-4" />
          Publisert ({tabCounts.upcoming})
        </Button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Tab Header */}
        <div className="mb-4">
          <h3 className="text-lg font-medium">
            {activeTab === 'incoming' && 'Innkommende forespørsler'}
            {activeTab === 'sent' && 'Sendte forespørsler'}
            {activeTab === 'ongoing' && 'Pågående avtaler'}
            {activeTab === 'upcoming' && 'Publiserte arrangementer'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'incoming' && 'Forespørsler du har mottatt'}
            {activeTab === 'sent' && 'Forespørsler du har sendt'}
            {activeTab === 'ongoing' && 'Avtaler under forhandling'}
            {activeTab === 'upcoming' && 'Arrangementer som er publisert'}
          </p>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {currentBookings.length === 0 ? (
            <EmptyState 
              icon={activeTab === 'incoming' ? Inbox : activeTab === 'sent' ? Send : activeTab === 'ongoing' ? Clock : Check}
              message={
                activeTab === 'incoming' ? 'Ingen innkommende forespørsler' :
                activeTab === 'sent' ? 'Ingen sendte forespørsler' :
                activeTab === 'ongoing' ? 'Ingen pågående avtaler' :
                'Ingen publiserte arrangementer'
              }
            />
          ) : (
            currentBookings.map((booking) => (
              <SafeBookingCard
                key={`${booking.id}-${booking.updated_at}`}
                booking={booking}
                currentUserId={profile.user_id}
                onDetailsClick={() => {
                  // Details are shown in the booking card itself
                }}
                onAction={refetch}
              />
            ))
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Oppdater liste
        </Button>
      </div>
    </div>
  );
};