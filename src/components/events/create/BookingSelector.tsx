import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface BookingSelectorProps {
  userId: string;
  onSelect: (booking: any) => void;
  selectedBookingId?: string | null;
  onClear?: () => void;
}

/**
 * BookingSelector - Velg en godkjent booking-avtale for å autofylle arrangement
 * 
 * Viser kun bookings hvor:
 * - Brukeren er involvert (sender eller receiver)
 * - Status er 'both_parties_approved' eller 'upcoming'
 * - Booking ikke allerede har et arrangement
 */
export const BookingSelector = ({ 
  userId, 
  onSelect, 
  selectedBookingId,
  onClear 
}: BookingSelectorProps) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { bookings: allBookings, loading: bookingsLoading } = useBookings(userId);

  useEffect(() => {
    if (!bookingsLoading) {
      // Filtrer: both_parties_approved eller upcoming, og ikke allerede koblet til arrangement
      const availableBookings = allBookings.filter(
        (b: any) => 
          (b.sender_id === userId || b.receiver_id === userId) &&
          (b.status === 'both_parties_approved' || b.status === 'upcoming') &&
          !b.event_id // Ikke vis bookings som allerede har arrangement
      );
      
      setBookings(availableBookings);
      setLoading(false);
    }
  }, [allBookings, bookingsLoading, userId]);

  useEffect(() => {
    if (selectedBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === selectedBookingId);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  }, [selectedBookingId, bookings]);

  const handleSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      onSelect(booking);
    }
  };

  const handleClear = () => {
    setSelectedBooking(null);
    onClear?.();
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Laster booking-avtaler...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!selectedBooking ? (
        <>
          <Select
            value=""
            onValueChange={handleSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg booking-avtale (valgfritt)" />
            </SelectTrigger>
            <SelectContent>
              {bookings.length === 0 ? (
                <SelectItem value="" disabled>
                  Ingen godkjente avtaler tilgjengelig
                </SelectItem>
              ) : (
                bookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    {booking.title} - {booking.event_date 
                      ? format(new Date(booking.event_date), 'dd.MM.yyyy', { locale: nb }) 
                      : 'Ingen dato'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {bookings.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Velg en booking-avtale for å autofylle arrangement-detaljer
            </p>
          )}
        </>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Valgt avtale: <strong>{selectedBooking.title}</strong>
              {selectedBooking.event_date && (
                <span className="text-muted-foreground ml-2">
                  ({format(new Date(selectedBooking.event_date), 'dd.MM.yyyy', { locale: nb })})
                </span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
