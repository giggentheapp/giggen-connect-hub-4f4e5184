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
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;

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
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Booking slettet",
        description: "Bookingen har blitt permanent slettet",
      });
      
      onAction?.();
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeleteWarningText = () => {
    if (booking.status === 'confirmed') {
      return "Dette vil permanent slette en bekreftet booking. Kontaktinformasjon vil ikke lenger være tilgjengelig for noen av partene.";
    }
    return "Denne handlingen kan ikke angres. Bookingen vil bli permanent slettet.";
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

      {/* Delete button - available for rejected and confirmed bookings */}
      {(booking.status === 'rejected' || booking.status === 'confirmed') && (
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
              <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
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
                Slett permanent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};