import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingsSafe, SafeBooking } from '@/hooks/useBookingsSafe';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Trash, ArrowRight, Edit, MessageSquare, FileText, Globe } from 'lucide-react';

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
  const [showAgreementSummary, setShowAgreementSummary] = useState(false);
  const { updateBooking, deleteBooking, rejectBooking } = useBookingsSafe();
  const { toast } = useToast();

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;

  // Safe action handler
  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await action();
      toast({
        title: "Suksess",
        description: successMessage,
      });
      onAction?.();
    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: "Feil",
        description: "Handlingen feilet. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // FASE 1: Pending actions
  const handleAllowBooking = () => handleAction(async () => {
    await updateBooking(booking.id, {
      status: 'allowed',
    });
  }, "Forespørsel godkjent! Dere kan nå diskutere detaljer.");

  const handleRejectRequest = () => handleAction(async () => {
    await rejectBooking(booking.id);
  }, "Forespørsel avvist og slettet.");

  // FASE 2: Agreement phase actions
  const handleApproveAgreement = () => {
    // Get other party approval status
    const otherPartyApproved = isSender ? booking.approved_by_receiver : booking.approved_by_sender;
    
    return handleAction(async () => {
      const updates: Partial<SafeBooking> = {
        status: otherPartyApproved ? 'approved_by_both' : (isSender ? 'approved_by_sender' : 'approved_by_receiver')
      };

      if (otherPartyApproved) {
        updates.status = 'approved_by_both';
      }

      await updateBooking(booking.id, updates);
    }, otherPartyApproved ? "Avtalen er godkjent av begge parter!" : "Du har godkjent avtalen. Venter på motpart.");
  };

  const handleCancelAgreement = () => handleAction(async () => {
    await deleteBooking(booking.id);
  }, "Avtalen er avbrutt og slettet.");

  // FASE 3: Publishing actions
  const handlePublishEvent = () => handleAction(async () => {
    await updateBooking(booking.id, {
      status: 'upcoming',
      is_public_after_approval: true,
    });
  }, "Arrangementet er publisert og synlig for alle!");

  // FASE 4: Final actions
  const handleMarkCompleted = () => handleAction(async () => {
    await updateBooking(booking.id, {
      status: 'completed',
    });
  }, "Arrangementet er markert som fullført.");

  const handleDeleteBooking = () => handleAction(async () => {
    await deleteBooking(booking.id);
  }, "Bookingen er slettet.");

  // Get other party approval status
  const otherPartyApproved = isSender ? booking.approved_by_receiver : booking.approved_by_sender;
  const currentUserApproved = isSender ? booking.approved_by_sender : booking.approved_by_receiver;

  // Agreement Summary Component
  const AgreementSummary = () => (
    <Dialog open={showAgreementSummary} onOpenChange={setShowAgreementSummary}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Avtaleoversikt - {booking.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Dato:</strong> {booking.event_date ? new Date(booking.event_date).toLocaleDateString('nb-NO') : 'Ikke satt'}</p>
              {booking.time && <p><strong>Tid:</strong> {booking.time}</p>}
              {booking.venue && <p><strong>Venue:</strong> {booking.venue}</p>}
              {booking.audience_estimate && <p><strong>Forventet publikum:</strong> {booking.audience_estimate} personer</p>}
              {booking.ticket_price && <p><strong>Billettpris:</strong> {booking.ticket_price} kr</p>}
              {booking.artist_fee && <p><strong>Artisthonorar:</strong> {booking.artist_fee} kr</p>}
            </CardContent>
          </Card>
          
          {booking.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beskrivelse</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{booking.description}</p>
              </CardContent>
            </Card>
          )}

          {booking.personal_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personlig melding</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{booking.personal_message}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setShowAgreementSummary(false)} variant="outline">
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Don't show actions if user is not part of the booking
  if (!isSender && !isReceiver) {
    return null;
  }

  // Render actions based on booking status and user role
  switch (booking.status) {
    case 'pending':
      if (isReceiver) {
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAllowBooking}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Godkjenn forespørsel
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
                    Dette vil permanent slette forespørselen. Handlingen kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRejectRequest}>
                    Avvis forespørsel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }
      if (isSender) {
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>
              <MessageSquare className="h-4 w-4 mr-1" />
              Venter på svar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={loading}>
                  <Trash className="h-4 w-4 mr-1" />
                  Trekk tilbake
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trekk tilbake forespørsel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil permanent slette forespørselen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRejectRequest}>
                    Trekk tilbake
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }
      break;

    case 'allowed':
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleApproveAgreement}
            disabled={loading || currentUserApproved}
            className={currentUserApproved ? "bg-green-600" : ""}
          >
            <Check className="h-4 w-4 mr-1" />
            {currentUserApproved ? "Du har godkjent" : "Godkjenn avtale"}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAgreementSummary(true)}
          >
            <FileText className="h-4 w-4 mr-1" />
            Se oversikt
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={loading}>
                <Trash className="h-4 w-4 mr-1" />
                Avbryt avtale
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Avbryt avtale?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent slette avtalen og alle tilhørende detaljer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelAgreement}>
                  Avbryt avtale
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AgreementSummary />
        </div>
      );

    case 'approved_by_sender':
      if (isSender) {
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled className="bg-green-100">
              <Check className="h-4 w-4 mr-1" />
              Du har godkjent
            </Button>
            <Button size="sm" variant="outline" disabled>
              Venter på motpart
            </Button>
          </div>
        );
      }
      if (isReceiver) {
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleApproveAgreement}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Godkjenn avtale (din tur!)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAgreementSummary(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Se oversikt
            </Button>
          </div>
        );
      }
      break;

    case 'approved_by_receiver':
      if (isReceiver) {
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled className="bg-green-100">
              <Check className="h-4 w-4 mr-1" />
              Du har godkjent
            </Button>
            <Button size="sm" variant="outline" disabled>
              Venter på motpart
            </Button>
          </div>
        );
      }
      if (isSender) {
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleApproveAgreement}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Godkjenn avtale (din tur!)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAgreementSummary(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Se oversikt
            </Button>
          </div>
        );
      }
      break;

    case 'approved_by_both':
    case 'both_parties_approved':
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handlePublishEvent}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Globe className="h-4 w-4 mr-1" />
            Publiser arrangement
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAgreementSummary(true)}
          >
            <FileText className="h-4 w-4 mr-1" />
            Se avtale
          </Button>
          
          <AgreementSummary />
        </div>
      );

    case 'upcoming':
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleMarkCompleted}
            disabled={loading}
            variant="outline"
          >
            <Check className="h-4 w-4 mr-1" />
            Marker som fullført
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={loading}>
                <Trash className="h-4 w-4 mr-1" />
                Slett arrangement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett publisert arrangement?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil fjerne arrangementet fra offentlig visning og slette alle data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBooking}>
                  Slett arrangement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );

    case 'completed':
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled className="bg-gray-100">
            <Check className="h-4 w-4 mr-1" />
            Fullført
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={loading}>
                <Trash className="h-4 w-4 mr-1" />
                Arkiver
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Arkiver fullført arrangement?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent fjerne arrangementet fra listen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBooking}>
                  Arkiver
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );

    default:
      return null;
  }

  return null;
};