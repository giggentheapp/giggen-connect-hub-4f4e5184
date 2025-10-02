import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Trash, ArrowRight, Eye, Settings, Calendar, MapPin, Users, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
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
    navigate(`/booking/${booking.id}/review`);
  };

  // Step 3: Individual publishing (each party can publish separately)
  const handlePublishBooking = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const publishField = isSender ? 'published_by_sender' : 'published_by_receiver';
      const updates = {
        [publishField]: true,
        status: 'upcoming' as const,
        is_public_after_approval: true,
        published_at: new Date().toISOString()
      };
      
      const result = await updateBooking(booking.id, updates);
      
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
      // Always use permanent deletion - no more history
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
      // Always use permanent deletion - no more history
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
    setShowSummaryDialog(true);
  };
  const PublishingSummaryDialog = () => (
    <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Forhåndsvisning av publisert arrangement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Public Event View - Same as actual public view */}
          <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
            {/* Event Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{booking.title}</h1>
                <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white">
                  Offentlig
                </Badge>
              </div>
              
              {booking.description && (
                <p className="text-base text-muted-foreground mt-2">
                  {booking.description}
                </p>
              )}
            </div>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-accent-orange" />
                  Arrangementsinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-accent-orange mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Dato</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                          {booking.time && ` kl. ${booking.time}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.venue && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-accent-orange mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Spillested</p>
                        <p className="text-sm text-muted-foreground">{booking.venue}</p>
                      </div>
                    </div>
                  )}

                  {booking.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-accent-orange mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Adresse</p>
                        <p className="text-sm text-muted-foreground">{booking.address}</p>
                      </div>
                    </div>
                  )}

                  {booking.audience_estimate && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-accent-orange mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Forventet publikum</p>
                        <p className="text-sm text-muted-foreground">{booking.audience_estimate} personer</p>
                      </div>
                    </div>
                  )}

                  {booking.ticket_price && (
                    <div className="flex items-start gap-3">
                      <Banknote className="h-5 w-5 text-accent-orange mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Billettpris</p>
                        <p className="text-sm text-muted-foreground">{booking.ticket_price} kr</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            {booking.selected_concept_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-5 w-5 text-accent-orange" />
                    Portefølje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConceptPortfolioGallery conceptId={booking.selected_concept_id} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info box */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                ℹ️ Slik vil arrangementet se ut for publikum når det publiseres. Økonomiske detaljer og kontaktinformasjon vil forbli privat.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handlePublishBooking} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
            
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  return <>
      <div className="flex gap-1.5 items-center flex-wrap">
        {/* STEP 1: Allow booking (receiver only, pending status) */}
        {isReceiver && booking.status === 'pending' && (
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
        )}

        {/* STEP 2: Individual approval (each party approves separately) */}
        {booking.status === 'allowed' && (
          <div className="flex gap-1.5 items-center">
            {!booking[isSender ? 'approved_by_sender' : 'approved_by_receiver'] ? (
              <Button 
                onClick={openAgreementReview} 
                disabled={loading} 
                size="sm"
                className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Godkjenn
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
                ✓ Godkjent
              </Badge>
            )}
          </div>
        )}

        {/* Progressive approval statuses */}
        {(booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver') && (
          <div className="flex gap-1.5 items-center">
            {booking.status === 'approved_by_sender' && isSender && (
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
                ✓ Du har godkjent
              </Badge>
            )}
            {booking.status === 'approved_by_receiver' && isReceiver && (
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
                ✓ Du har godkjent
              </Badge>
            )}
            {booking.status === 'approved_by_sender' && isReceiver && (
              <Button 
                onClick={openAgreementReview} 
                disabled={loading} 
                size="sm"
                className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Godkjenn
              </Button>
            )}
            {booking.status === 'approved_by_receiver' && isSender && (
              <Button 
                onClick={openAgreementReview} 
                disabled={loading} 
                size="sm"
                className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Godkjenn
              </Button>
            )}
          </div>
        )}

        {/* STEP 3: Publish (both parties, approved_by_both status) */}
        {booking.status === 'approved_by_both' && (
          <div className="flex gap-1.5 items-center">
            {!booking[isSender ? 'published_by_sender' : 'published_by_receiver'] ? (
              <Button 
                onClick={showPublishingSummary} 
                disabled={loading} 
                size="sm"
                className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Publiser
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                ✓ Publisert
              </Badge>
            )}
          </div>
        )}

        {/* Show status for sent requests (sender view of pending) */}
        {isSender && booking.status === 'pending' && (
          <Badge variant="secondary" className="text-xs text-muted-foreground">
            Venter...
          </Badge>
        )}

        {/* Single cancel/delete button with confirmation for ongoing bookings */}
        {(booking.status === 'allowed' || booking.status === 'approved_by_sender' || booking.status === 'approved_by_receiver' || booking.status === 'approved_by_both' || booking.status === 'upcoming') && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={loading}
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {booking.status === 'upcoming' ? 'Slett publisert arrangement?' : 'Avlys booking?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  {getDeleteWarningText()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs">Avbryt</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={booking.status === 'upcoming' ? handleDeleteBooking : handleCancelBooking}
                  className="bg-red-600 hover:bg-red-700 text-xs"
                >
                  {booking.status === 'upcoming' ? 'Slett permanent' : 'Avlys'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </div>

      <PublishingSummaryDialog />
    </>;
};