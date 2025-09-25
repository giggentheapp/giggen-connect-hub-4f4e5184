import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';

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
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppTranslation();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching bookings for user:', profile.user_id);
        
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          throw fetchError;
        }
        
        console.log('Fetched bookings:', data);
        setBookings(data || []);
        
      } catch (err: any) {
        console.error('Bookings fetch error:', err);
        setError(err.message || 'Unknown error occurred');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchBookings();
    } else {
      setLoading(false);
      setError('No user profile provided');
    }
  }, [profile?.user_id]);

  if (loading) {
    return (
      <div className="bookings-loading p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t('Loading Bookings') || 'Loading bookings...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-error p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Bookings Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Error: {error}
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                {t('Refresh Page') || 'Reload Page'}
              </Button>
              <Button 
                onClick={() => setError(null)}
                variant="default"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bookings-page space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('Bookings') || 'Bookings'}
        </h1>
        <span className="text-sm text-muted-foreground">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </span>
      </div>
      
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-4xl">📅</div>
              <div>
                <h3 className="text-lg font-medium">No bookings found</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any bookings yet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bookings-list space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="booking-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {booking.title || 'Untitled Booking'}
                  </CardTitle>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status || 'unknown'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {booking.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {booking.description}
                    </p>
                  )}
                  {booking.venue && (
                    <p><strong>Venue:</strong> {booking.venue}</p>
                  )}
                  {booking.event_date && (
                    <p><strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role: {booking.sender_id === profile.user_id ? 'Sender' : 'Receiver'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};