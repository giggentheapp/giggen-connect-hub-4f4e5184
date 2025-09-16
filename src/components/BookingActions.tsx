import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ComprehensiveAgreementReview } from '@/components/ComprehensiveAgreementReview';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Trash, ArrowRight, Eye, Settings } from 'lucide-react';
interface BookingActionsProps {
  booking: any;
  currentUserId: string;
  onAction?: () => void;
}
export const BookingActions = ({
  booking,
  currentUserId,
  onAction
}: BookingActionsProps) => {
  const [loading, setLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showAgreementReview, setShowAgreementReview] = useState(false);
  const {
    updateBooking,
    deleteBookingSecurely,
    rejectBooking,
    permanentlyDeleteBooking
  } = useBookings();
  const {
    toast
  } = useToast();
  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;

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
    console.log('📋 Opening agreement review for approval');
    setShowAgreementReview(true);
  };

  // Step 3: Individual publishing (each party can publish separately)
  const handlePublishBooking = async () => {
    if (loading) return;
    setLoading(true);
    
    console.log('📢 Publishing booking:', {
      bookingId: booking.id,
      title: booking.title,
      currentUser: isSender ? 'sender' : 'receiver',
      currentStatus: booking.status,
      event_date: booking.event_date,
      published_by_sender: booking.published_by_sender,
      published_by_receiver: booking.published_by_receiver
    });
    
    try {
      const publishField = isSender ? 'published_by_sender' : 'published_by_receiver';
      const updates = {
        [publishField]: true,
        status: 'upcoming' as const,
        is_public_after_approval: true,
        published_at: new Date().toISOString()
      };
      
      console.log('🔄 Updating booking with:', updates);
      
      const result = await updateBooking(booking.id, updates);
      
      console.log('✅ Booking published successfully:', {
        bookingId: booking.id,
        newStatus: result?.status,
        published_by_sender: result?.published_by_sender,
        published_by_receiver: result?.published_by_receiver
      });
      
      toast({
        title: "Du har publisert arrangementet!",
        description: "Arrangementet er nå synlig for andre brukere og kan ikke lenger redigeres."
      });
      onAction?.();
    } catch (error) {
      console.error('❌ Error publishing booking:', error);
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };
  const handleRejectBooking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (booking.status === 'pending') {
        // This is rejection of a pending request - use permanent deletion
        await rejectBooking(booking.id);
        toast({
          title: "Forespørsel avvist",
          description: "Forespørselen er permanent slettet fra systemet"
        });
      } else {
        // This is cancellation of an approved booking - use soft deletion
        await updateBooking(booking.id, {
          status: 'cancelled'
        });
        toast({
          title: "Avtale avlyst",
          description: "Avtalen har blitt avlyst og flyttet til historikk"
        });
      }
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
      // Always use permanent deletion for ongoing bookings
      await permanentlyDeleteBooking(booking.id);
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
      await deleteBookingSecurely(booking.id, 'Bruker slettet bookingen');
      onAction?.();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
    } finally {
      setLoading(false);
    }
  };
  const getDeleteWarningText = () => {
    if (booking.status === 'upcoming') {
      return "Dette vil slette et publisert arrangement. ADVARSEL: Dette kan påvirke andre brukere som har sett arrangementet.";
    } else if (booking.status === 'both_parties_approved') {
      return "Dette vil avlyse en pågående avtale og flytte den til historikk.";
    }
    return "Bookingen vil bli flyttet til historikk-seksjonen.";
  };
  const showPublishingSummary = () => {
    setShowSummaryDialog(true);
  };
  const PublishingSummaryDialog = () => <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publiser arrangement - Full oppsummering</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Arrangementsinformasjon</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Tittel:</strong> {booking.title}</p>
              {booking.description && <p><strong>Beskrivelse:</strong> {booking.description}</p>}
              {booking.event_date && <p><strong>Dato:</strong> {new Date(booking.event_date).toLocaleDateString('no-NO')}</p>}
              {booking.venue && <p><strong>Sted:</strong> {booking.venue}</p>}
              {booking.price_musician && <p><strong>Honorar:</strong> {booking.price_musician}</p>}
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Viktig informasjon</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Etter publisering kan arrangementet ikke redigeres</li>
              <li>• Andre brukere kan se arrangementet (med begrenset info)</li>
              <li>• Kun tittel, beskrivelse, dato og sted blir synlig for andre</li>
              <li>• Kontaktinfo og priser forblir private</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handlePublishBooking} disabled={loading}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
  return <>
      <div className="flex gap-2 flex-wrap">
        {/* STEP 1: Allow booking (receiver only, pending status) */}
        {isReceiver && booking.status === 'pending' && <>
            <Button onClick={handleAllowBooking} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-1" />
              Tillat (1/3)
            </Button>
            <Button variant="outline" onClick={handleRejectBooking} disabled={loading}>
              <X className="h-4 w-4 mr-1" />
              Avvis
            </Button>
          </>}

        {/* STEP 2: Individual approval (each party approves separately) */}
        {booking.status === 'allowed' && <>
            {/* Show current user's approval status */}
            {!booking[isSender ? 'approved_by_sender' : 'approved_by_receiver'] ? <Button onClick={openAgreementReview} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                <Check className="h-4 w-4 mr-1" />
                Godkjenn for publisering (2/3)
              </Button> : <Badge variant="outline" className="text-green-700 border-green-300">
                Du har godkjent ✓
                {booking.status !== 'approved_by_both' && ' - Venter på motpart'}
              </Badge>}
          </>}

        {/* Progressive approval statuses */}
        {(booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver') && <>
            {booking.status === 'approved_by_sender' && isSender && <Badge variant="outline" className="text-green-700 border-green-300">
                Du har godkjent ✓ - Venter på motpart
              </Badge>}
            {booking.status === 'approved_by_receiver' && isReceiver && <Badge variant="outline" className="text-green-700 border-green-300">
                Du har godkjent ✓ - Venter på motpart
              </Badge>}
            {booking.status === 'approved_by_sender' && isReceiver && <>
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  Motpart har godkjent - Din tur!
                </Badge>
                <Button onClick={openAgreementReview} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                  <Check className="h-4 w-4 mr-1" />
                  Godkjenn for publisering (2/3)
                </Button>
              </>}
            {booking.status === 'approved_by_receiver' && isSender && <>
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  Motpart har godkjent - Din tur!
                </Badge>
                <Button onClick={openAgreementReview} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                  <Check className="h-4 w-4 mr-1" />
                  Godkjenn for publisering (2/3)
                </Button>
              </>}
          </>}

        {/* STEP 3: Publish (both parties, approved_by_both status) */}
        {booking.status === 'approved_by_both' && <>
            {/* Show current user's publish status */}
            {!booking[isSender ? 'published_by_sender' : 'published_by_receiver'] ? <Button onClick={showPublishingSummary} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <ArrowRight className="h-4 w-4 mr-1" />
                Publiser arrangement (3/3)
              </Button> : <Badge variant="outline" className="text-blue-700 border-blue-300">
                Du har publisert ✓
              </Badge>}
            
            {/* Show other party's publish status */}
            {booking[isSender ? 'published_by_receiver' : 'published_by_sender'] && <Badge variant="outline" className="text-blue-700 border-blue-300">
                Motpart har publisert ✓
              </Badge>}
          </>}

        {/* Show status for sent requests (sender view of pending) */}
        {isSender && booking.status === 'pending' && <div className="flex items-center text-sm text-muted-foreground">
            <Eye className="h-4 w-4 mr-1" />
            Venter på mottakers svar
          </div>}

        {/* Single cancel/delete button with confirmation for ongoing bookings */}
        {(booking.status === 'allowed' || booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver' || booking.status === 'approved_by_both') && <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <X className="h-4 w-4 mr-1" />
                Avlys booking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Er du sikker på at du vil avlyse denne bookingen?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent slette bookingen og all relatert data fra systemet. Handlingen kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Slett permanent
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}

        {/* Delete button for historical bookings */}
        {(booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'upcoming') && <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-1" />
                Slett
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  {getDeleteWarningText()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBooking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Slett
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}
      </div>

      <PublishingSummaryDialog />
      
      {/* Comprehensive Agreement Review */}
      <ComprehensiveAgreementReview
        booking={booking}
        isOpen={showAgreementReview}
        onClose={() => setShowAgreementReview(false)}
        currentUserId={currentUserId}
        onApprovalComplete={onAction}
      />
    </>;
};