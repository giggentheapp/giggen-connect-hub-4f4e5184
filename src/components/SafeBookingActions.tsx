import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookingsSafe, SafeBooking } from '@/hooks/useBookingsSafe';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ArrowRight } from 'lucide-react';

interface SafeBookingActionsProps {
  booking: SafeBooking;
  currentUserId: string;
  onAction?: () => void;
}

export const SafeBookingActions = ({
  booking,
  currentUserId,
  onAction
}: SafeBookingActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { updateBooking, deleteBooking, rejectBooking } = useBookingsSafe();
  const { toast } = useToast();

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;

  // Safe action handler
  const handleAction = async (action: () => Promise<void>) => {
    if (loading) return;
    setLoading(true);
    try {
      await action();
      onAction?.();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Allow booking (receiver only for pending)
  const handleAllowBooking = () => handleAction(async () => {
    await updateBooking(booking.id, {
      status: 'allowed',
    });
    toast({
      title: "Forespørsel godkjent",
      description: "Dere kan nå diskutere detaljer",
    });
  });

  // Approve booking
  const handleApproveBooking = () => handleAction(async () => {
    const approvalField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
    const updates: Partial<SafeBooking> = { status: 'approved_by_both' };
    
    await updateBooking(booking.id, updates);
    toast({
      title: "Booking godkjent",
      description: "Arrangementet kan nå publiseres",
    });
  });

  // Publish booking
  const handlePublishBooking = () => handleAction(async () => {
    await updateBooking(booking.id, {
      status: 'upcoming',
      is_public_after_approval: true,
    });
    toast({
      title: "Arrangement publisert",
      description: "Arrangementet er nå synlig for alle",
    });
  });

  // Reject booking
  const handleRejectBooking = () => handleAction(async () => {
    if (booking.status === 'pending') {
      await rejectBooking(booking.id);
    } else {
      await deleteBooking(booking.id);
    }
  });

  // Render actions based on status and user role
  const renderActions = () => {
    switch (booking.status) {
      case 'pending':
        if (isReceiver) {
          return (
            <>
              <Button 
                size="sm" 
                onClick={handleAllowBooking}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-1" />
                Godkjenn
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={loading}>
                    <X className="h-4 w-4 mr-1" />
                    Avvis
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Avvis forespørsel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dette vil permanent slette forespørselen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRejectBooking}>
                      Avvis forespørsel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          );
        }
        return null;

      case 'allowed':
        return (
          <>
            <Button 
              size="sm" 
              onClick={handleApproveBooking}
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-1" />
              Godkjenn avtale
            </Button>
          </>
        );

      case 'approved_by_both':
      case 'both_parties_approved':
        return (
          <Button 
            size="sm" 
            onClick={handlePublishBooking}
            disabled={loading}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Publiser arrangement
          </Button>
        );

      case 'upcoming':
      case 'completed':
        return null; // Delete functionality handled by BookingActions

      default:
        return null;
    }
  };

  if (!isSender && !isReceiver) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {renderActions()}
    </div>
  );
};