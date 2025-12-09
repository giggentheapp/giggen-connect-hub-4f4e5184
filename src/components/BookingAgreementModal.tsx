import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2 } from 'lucide-react';
import { BookingAgreement } from '@/components/BookingAgreement';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

interface BookingAgreementModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingAgreementModal = ({
  bookingId,
  isOpen,
  onClose,
  currentUserId,
}: BookingAgreementModalProps) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBooking();
    }
  }, [isOpen, bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data as Booking);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !bookingId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Booking-avtale</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : booking ? (
            <div className="p-4">
              <BookingAgreement
                booking={booking}
                isOpen={true}
                onClose={onClose}
                currentUserId={currentUserId}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Kunne ikke laste booking-avtale
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
