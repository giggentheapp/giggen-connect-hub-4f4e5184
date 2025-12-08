import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ArrowRight, Archive, Trash2 } from 'lucide-react';
import { BookingPublishPreviewModal } from '@/components/BookingPublishPreviewModal';
import { BookingActionProps } from '@/types/booking';
import { isSender as checkIsSender, isReceiver as checkIsReceiver } from '@/utils/bookingUtils';

export const BookingActions = ({
  booking,
  currentUserId,
  onAction
}: BookingActionProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPublishPreview, setShowPublishPreview] = useState(false);
  const {
    updateBooking,
    rejectBooking,
    permanentlyDeleteBooking
  } = useBookings(currentUserId);
  const { toast } = useToast();
  
  const isSender = checkIsSender(currentUserId, booking);
  const isReceiver = checkIsReceiver(currentUserId, booking);

  // Step 1: Allow booking (receiver only)
  const handleAllowBooking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await updateBooking(booking.id, {
        status: 'allowed',
        receiver_allowed_at: new Date().toISOString()
      });
      toast({
        title: "Forespørsel tillatt",
        description: "Begge parter har nå tilgang til kontaktinfo og kan redigere avtaledetaljer."
      });
      onAction?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Open comprehensive agreement review before approval
  const openAgreementReview = () => {
    navigate(`/booking/${booking.id}/review`);
  };

  const handleRejectBooking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await rejectBooking(booking.id);
      toast({
        title: "Forespørsel avvist",
        description: "Forespørselen er permanent slettet fra systemet"
      });
      onAction?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await permanentlyDeleteBooking(booking.id);
      onAction?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToHistory = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await updateBooking(booking.id, { status: 'completed' });
      toast({
        title: "Flyttet til historikk",
        description: "Arrangementet er nå arkivert i historikken"
      });
      onAction?.();
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke flytte til historikk",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await permanentlyDeleteBooking(booking.id);
      toast({
        title: "Booking permanent slettet",
        description: "Bookingen er permanent fjernet fra systemet og kan ikke gjenopprettes"
      });
      onAction?.();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeleteWarningText = () => {
    if (booking.status === 'upcoming') {
      return "Dette vil PERMANENT slette et publisert arrangement. ADVARSEL: Dette kan påvirke andre brukere som har sett arrangementet.";
    }
    return "Dette vil PERMANENT slette bookingen fra systemet. Handlingen kan ikke angres.";
  };

  const showPublishingSummary = () => {
    setShowPublishPreview(true);
  };

  // Render functions for different states
  const renderPendingActions = () => {
    if (!isReceiver) {
      return (
        <Badge variant="secondary" className="text-xs text-muted-foreground">
          Venter...
        </Badge>
      );
    }

    return (
      <div className="flex gap-1.5">
        <Button 
          onClick={handleAllowBooking} 
          disabled={loading} 
          size="sm"
          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
        >
          <Check className="h-3 w-3 mr-1" />
          Tillat
        </Button>
        <Button 
          variant="outline" 
          onClick={handleRejectBooking} 
          disabled={loading}
          size="sm"
          className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
        >
          <X className="h-3 w-3 mr-1" />
          Avvis
        </Button>
      </div>
    );
  };

  const renderAllowedActions = () => {
    const userApprovedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
    
    if (booking[userApprovedField]) {
      return (
        <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
          ✓ Godkjent
        </Badge>
      );
    }

    return (
      <Button 
        onClick={openAgreementReview} 
        disabled={loading} 
        size="sm"
        className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
      >
        <Check className="h-3 w-3 mr-1" />
        Godkjenn
      </Button>
    );
  };

  const renderProgressiveApprovalActions = () => {
    const isSenderApproved = booking.status === 'approved_by_sender';
    const isReceiverApproved = booking.status === 'approved_by_receiver';
    
    if (isSenderApproved && isSender) {
      return (
        <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
          ✓ Du har godkjent
        </Badge>
      );
    }
    
    if (isReceiverApproved && isReceiver) {
      return (
        <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
          ✓ Du har godkjent
        </Badge>
      );
    }
    
    if ((isSenderApproved && isReceiver) || (isReceiverApproved && isSender)) {
      return (
        <Button 
          onClick={openAgreementReview} 
          disabled={loading} 
          size="sm"
          className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
        >
          <Check className="h-3 w-3 mr-1" />
          Godkjenn
        </Button>
      );
    }
    
    return null;
  };

  const renderPublishActions = () => {
    const userPublishedField = isSender ? 'published_by_sender' : 'published_by_receiver';
    
    if ((booking as any)[userPublishedField]) {
      return (
        <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
          ✓ Publisert
        </Badge>
      );
    }

    return (
      <Button 
        onClick={showPublishingSummary} 
        disabled={loading} 
        size="sm"
        className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
      >
        <ArrowRight className="h-3 w-3 mr-1" />
        Publiser
      </Button>
    );
  };

  const renderArchiveButton = () => {
    const canArchive = ['upcoming', 'approved_by_both', 'approved_by_sender', 'approved_by_receiver', 'allowed'].includes(booking.status);
    
    if (!canArchive) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={loading}
            className="h-7 px-2 text-xs hover:bg-muted"
          >
            <Archive className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flytt til historikk?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Dette vil markere arrangementet som fullført og flytte det til historikk-seksjonen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMoveToHistory}
              className="text-xs"
            >
              Flytt til historikk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderDeleteButton = () => {
    const canDelete = ['completed', 'cancelled'].includes(booking.status);
    
    if (!canDelete) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={loading}
            className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Dette vil PERMANENT slette bookingen fra systemet. Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBooking}
              className="bg-red-600 hover:bg-red-700 text-xs"
            >
              Slett permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderCancelButton = () => {
    const canCancel = ['allowed', 'approved_by_sender', 'approved_by_receiver', 'approved_by_both'].includes(booking.status);
    
    if (!canCancel) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={loading}
            className="h-7 px-2 text-xs hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avlys booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {getDeleteWarningText()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelBooking}
              className="bg-red-600 hover:bg-red-700 text-xs"
            >
              Avlys
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <>
      <div className="flex gap-1.5 items-center flex-wrap">
        {booking.status === 'pending' && renderPendingActions()}
        {booking.status === 'allowed' && renderAllowedActions()}
        {(booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver') && renderProgressiveApprovalActions()}
        {booking.status === 'approved_by_both' && renderPublishActions()}
        {renderArchiveButton()}
        {renderDeleteButton()}
        {renderCancelButton()}
      </div>
      
      {showPublishPreview && (
        <BookingPublishPreviewModal
          bookingId={booking.id}
          isOpen={showPublishPreview}
          onClose={() => setShowPublishPreview(false)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};
