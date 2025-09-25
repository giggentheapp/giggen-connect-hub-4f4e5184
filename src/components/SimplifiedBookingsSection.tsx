import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { Inbox, Send, Clock, Check } from 'lucide-react';

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

interface SimplifiedBookingsSectionProps {
  profile: UserProfile;
}

export const SimplifiedBookingsSection = ({ profile }: SimplifiedBookingsSectionProps) => {
  console.log('🔄 SimplifiedBookingsSection rendering for user:', profile.user_id);
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'ongoing' | 'upcoming'>('incoming');
  const { bookings, loading, refetch } = useBookings(profile.user_id);

  console.log('📊 Simplified bookings data:', { 
    bookingsCount: bookings?.length || 0, 
    loading, 
    userId: profile.user_id 
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Bookings...</p>
      </div>
    );
  }

  // Safe filtering
  const incomingRequests = bookings.filter(b => 
    b?.receiver_id === profile.user_id && b?.status === 'pending'
  );
  
  const sentRequests = bookings.filter(b => 
    b?.sender_id === profile.user_id && b?.status === 'pending'
  );
  
  const ongoingAgreements = bookings.filter(b => 
    (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
    ['allowed', 'approved_by_sender', 'approved_by_receiver', 'approved_by_both'].includes(b?.status)
  );
  
  const upcomingEvents = bookings.filter(b => 
    (b?.sender_id === profile.user_id || b?.receiver_id === profile.user_id) && 
    b?.status === 'upcoming'
  );

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-blue-100 text-blue-800',
      'allowed': 'bg-yellow-100 text-yellow-800',
      'approved_by_both': 'bg-purple-100 text-purple-800',
      'upcoming': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{booking.title || 'Untitled Booking'}</CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
        {booking.description && (
          <CardDescription>{booking.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {booking.venue && <p>Venue: {booking.venue}</p>}
          {booking.event_date && <p>Date: {booking.event_date}</p>}
          <p>Created: {new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'incoming':
        return incomingRequests.length > 0 ? 
          incomingRequests.map(renderBookingCard) : 
          <Card><CardContent className="text-center py-8"><p>No incoming requests</p></CardContent></Card>;
      
      case 'sent':
        return sentRequests.length > 0 ? 
          sentRequests.map(renderBookingCard) : 
          <Card><CardContent className="text-center py-8"><p>No sent requests</p></CardContent></Card>;
      
      case 'ongoing':
        return ongoingAgreements.length > 0 ? 
          ongoingAgreements.map(renderBookingCard) : 
          <Card><CardContent className="text-center py-8"><p>No ongoing agreements</p></CardContent></Card>;
      
      case 'upcoming':
        return upcomingEvents.length > 0 ? 
          upcomingEvents.map(renderBookingCard) : 
          <Card><CardContent className="text-center py-8"><p>No upcoming events</p></CardContent></Card>;
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b flex-wrap">
        <Button 
          variant={activeTab === 'incoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('incoming')} 
          className="flex items-center gap-2"
        >
          <Inbox className="h-4 w-4" />
          Incoming ({incomingRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'sent' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('sent')} 
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Sent ({sentRequests.length})
        </Button>
        <Button 
          variant={activeTab === 'ongoing' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('ongoing')} 
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Ongoing ({ongoingAgreements.length})
        </Button>
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('upcoming')} 
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Upcoming ({upcomingEvents.length})
        </Button>
      </div>

      <div className="space-y-4">
        {renderTabContent()}
      </div>
    </div>
  );
};