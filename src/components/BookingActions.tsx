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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Slik vil arrangementet bli vist til publikum
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* What the public will see */}
          <Card className="border-2 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dette vil andre brukere og publikum se
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-xl font-semibold text-primary mb-2">{booking.title}</h3>
                {booking.description && (
                  <p className="text-muted-foreground mb-4">{booking.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {format(new Date(booking.event_date), 'dd.MM.yyyy')}
                        {booking.time && ` kl. ${booking.time}`}
                      </span>
                    </div>
                  )}
                  
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        {booking.venue}
                        {booking.address && ` - ${booking.address}`}
                      </span>
                    </div>
                  )}

                  {booking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Forventet publikum: {booking.audience_estimate}</span>
                    </div>
                  )}
                </div>

                {/* Public ticket price if available */}
                {booking.ticket_price && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span className="font-medium">Billettpris: {booking.ticket_price} kr</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What only the owners will see - Enhanced with clear warnings */}
          <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                🔒 PRIVAT INFORMASJON - Kun synlig for dere som parter
              </CardTitle>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Følgende informasjon vil ALDRI bli vist til publikum eller andre brukere
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-red-100 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="space-y-4">
                  {/* Financial details - Enhanced */}
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border-l-4 border-red-500">
                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                      💰 Økonomiske detaljer (KONFIDENSIELT)
                    </h4>
                    <div className="text-sm space-y-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {booking.door_deal ? (
                        <>
                          <p className="font-medium">• Artist honorar: <span className="text-green-600 dark:text-green-400">{booking.door_percentage || 'X'}% av dørinntekter</span></p>
                          {booking.audience_estimate && booking.ticket_price && (
                            <p>• Estimert artist inntekt: <span className="font-bold text-green-600 dark:text-green-400">{Math.round((booking.audience_estimate * booking.ticket_price * (booking.door_percentage || 0)) / 100).toLocaleString('nb-NO')} kr</span></p>
                          )}
                        </>
                      ) : booking.by_agreement ? (
                        <p className="font-medium">• Artist honorar: <span className="text-blue-600 dark:text-blue-400">Avtales direkte mellom partene</span></p>
                      ) : (
                        <p className="font-medium">• Fast artist honorar: <span className="text-green-600 dark:text-green-400">{booking.artist_fee ? `${booking.artist_fee} kr` : 'Ikke spesifisert'}</span></p>
                      )}
                      
                      {booking.audience_estimate && booking.ticket_price && (
                        <p>• Total estimert billetinntekt: <span className="font-bold">{(booking.audience_estimate * booking.ticket_price).toLocaleString('nb-NO')} kr</span></p>
                      )}
                    </div>
                  </div>

                  {/* Contact and private info - Enhanced */}
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border-l-4 border-amber-500">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                      📞 Sensitive personopplysninger (BESKYTTET)
                    </h4>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Kontaktinformasjon (telefonnummer, e-post, personlige adresser)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Tekniske spesifikasjoner og hospitality rider
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Private meldinger mellom partene
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Komplett booking historikk og endringer
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Fullstendige økonomiske avtaler og betalingsinformasjon
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Privacy guarantee */}
                  <div className="bg-green-100 dark:bg-green-950/20 p-3 rounded border border-green-300 dark:border-green-700">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                      ✅ PERSONVERNGARANTI: All sensitiv informasjon forblir privat mellom dere som parter i avtalen.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePublishBooking} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
            
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
              Tilbake til avtale
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