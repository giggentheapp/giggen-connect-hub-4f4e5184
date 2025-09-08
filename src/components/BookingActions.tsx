import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Trash } from 'lucide-react';

interface BookingActionsProps {
  booking: any;
  currentUserId: string;
  onAction?: () => void;
}

export const BookingActions = ({ booking, currentUserId, onAction }: BookingActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { updateBooking, deleteBookingSecurely } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;

  // Clean up debug logging - remove these console.log statements for production

  const handleAcceptBooking = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Change status to confirmed
      await updateBooking(booking.id, { status: 'confirmed' });
      
      toast({
        title: "Forespørsel godtatt",
        description: "Bookingforespørselen er godtatt. Kontaktinformasjon er nå delt med begge parter.",
      });
      
      onAction?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await updateBooking(booking.id, { status: 'rejected' });
      
      toast({
        title: "Forespørsel avvist",
        description: "Bookingforespørselen har blitt avvist og flyttet til historikk",
      });
      
      onAction?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Use secure deletion which cleans sensitive data
      await deleteBookingSecurely(booking.id, 'Bruker slettet bookingen');
      
      onAction?.();
    } catch (error: any) {
      // Error already handled by deleteBookingSecurely function
      console.error('Error deleting booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeleteWarningText = () => {
    if (booking.status === 'confirmed' || booking.status === 'published') {
      return "Dette vil flytte en bekreftet booking til historikk. Du kan finne den igjen i historikk-seksjonen.";
    }
    return "Bookingen vil bli flyttet til historikk-seksjonen hvor du kan finne den igjen.";
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Accept button - only for receiver when status is pending */}
      {isReceiver && booking.status === 'pending' && (
        <Button 
          onClick={handleAcceptBooking}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-1" />
          Godta
        </Button>
      )}

      {/* Reject button - available for both parties when status is pending */}
      {booking.status === 'pending' && (
        <Button 
          variant="outline"
          onClick={handleRejectBooking}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-1" />
          Avvis
        </Button>
      )}

      {/* Delete button - available for rejected, confirmed, and published bookings */}
      {(booking.status === 'rejected' || booking.status === 'confirmed' || booking.status === 'published') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              size="sm"
            >
              <Trash className="h-4 w-4 mr-1" />
              Slett
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Flytt til historikk?</AlertDialogTitle>
              <AlertDialogDescription>
                {getDeleteWarningText()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteBooking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Flytt til historikk
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};