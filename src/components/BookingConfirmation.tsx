import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Check, Calendar, MapPin, Banknote, Users, FileText, Music, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
import { Booking } from '@/types/booking';
import { bookingService } from '@/services/bookingService';
import { isSender as checkIsSender, isReceiver as checkIsReceiver, bothPartiesApproved, bothPartiesReadAgreement } from '@/utils/bookingUtils';

interface BookingConfirmationProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingConfirmation = ({ booking, isOpen, onClose, currentUserId }: BookingConfirmationProps) => {
  const navigate = useNavigate();
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // Use realtime hook for booking updates
  const realtimeBooking = useBookingRealtime(booking, currentUserId, {
    onReceiverApproved: () => {
      // Optional: Add custom logic here if needed
    },
    onSenderApproved: () => {
      // Optional: Add custom logic here if needed
    }
  });

  // Use realtime booking data
  const currentBooking = realtimeBooking || booking;
  const isSender = currentBooking ? checkIsSender(currentUserId, currentBooking) : false;
  const isReceiver = currentBooking ? checkIsReceiver(currentUserId, currentBooking) : false;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';

  useEffect(() => {
    if (isOpen) {
      setHasReadAgreement(false);
      
      // Load maker profile using service layer
      const loadMakerProfile = async () => {
        if (booking?.receiver_id) {
          try {
            const profileData = await bookingService.getMakerProfile(booking.receiver_id);
            if (profileData) {
              setMakerProfile(profileData);
            }
          } catch (error) {
            console.error('Error loading maker profile:', error);
          }
        }
      };
      
      loadMakerProfile();
    }
  }, [isOpen, booking]);

  const handleConfirmBooking = async () => {
    if (!hasReadAgreement) {
      toast({
        title: "Les avtalen først",
        description: "Du må bekrefte at du har lest og forstått avtalen",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: any = { 
        [userConfirmedField]: true,
        [userReadField]: true
      };

      // If both parties confirm, update status
      if (currentBooking[otherUserConfirmedField]) {
        updates.status = 'both_parties_approved';
      }
      
      await updateBooking(currentBooking.id, updates);
      
      toast({
        title: "Avtale godkjent",
        description: "Du har godkjent bookingavtalen",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!currentBooking) return null;

  const bothConfirmed = bothPartiesApproved(currentBooking);
  const bothRead = bothPartiesReadAgreement(currentBooking);
  const canCreateEvent = bothConfirmed && bothRead && !(currentBooking as any).event_admin_id && !(currentBooking as any).event_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Avtale-oppsummering - {currentBooking.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Complete Agreement Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Komplett avtaleoversikt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{currentBooking.title}</h3>
                  {currentBooking.description && (
                    <p className="text-muted-foreground mb-4">{currentBooking.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentBooking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>
                        {format(new Date(currentBooking.event_date), 'dd.MM.yyyy')}
                        {currentBooking.time && ` kl. ${currentBooking.time}`}
                      </span>
                    </div>
                  )}
                  
                  {currentBooking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{currentBooking.venue}</span>
                    </div>
                  )}

                  {currentBooking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Publikum: {currentBooking.audience_estimate}</span>
                    </div>
                  )}

                  {currentBooking.ticket_price && (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span>Billettpris: {currentBooking.ticket_price}</span>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                {(currentBooking.price_musician || currentBooking.artist_fee || currentBooking.door_deal) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Artist honorar
                    </h4>
                    <p className="text-sm">
                      {currentBooking.door_deal ? (
                        `${currentBooking.door_percentage}% av dørinntekter`
                      ) : (
                        currentBooking.artist_fee || currentBooking.price_musician || 'Ikke spesifisert'
                      )}
                    </p>
                  </div>
                )}

                {/* Technical Requirements */}
                {currentBooking.tech_spec && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Tekniske krav</h4>
                    <p className="text-sm whitespace-pre-line">{currentBooking.tech_spec}</p>
                  </div>
                )}

                {/* Hospitality */}
                {currentBooking.hospitality_rider && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Hospitality</h4>
                    <p className="text-sm whitespace-pre-line">{currentBooking.hospitality_rider}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info - Show both parties' contact info */}
            {((isReceiver && currentBooking.sender_contact_info) || (isSender && currentBooking.receiver_contact_info)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sender Contact Info - visible to receiver */}
                  {isReceiver && currentBooking.sender_contact_info && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-muted-foreground">Fra arrangør:</h5>
                      {currentBooking.sender_contact_info.name && (
                        <div>
                          <span className="font-medium">Navn: </span>
                          {currentBooking.sender_contact_info.name}
                        </div>
                      )}
                      {currentBooking.sender_contact_info.email && (
                        <div>
                          <span className="font-medium">E-post: </span>
                          <a href={`mailto:${currentBooking.sender_contact_info.email}`} className="text-primary hover:underline">
                            {currentBooking.sender_contact_info.email}
                          </a>
                        </div>
                      )}
                      {currentBooking.sender_contact_info.phone && (
                        <div>
                          <span className="font-medium">Telefon: </span>
                          <a href={`tel:${currentBooking.sender_contact_info.phone}`} className="text-primary hover:underline">
                            {currentBooking.sender_contact_info.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Receiver Contact Info - visible to sender */}
                  {isSender && currentBooking.receiver_contact_info && (
                    <div className="space-y-2 border-t pt-4">
                      <h5 className="font-medium text-sm text-muted-foreground">Fra musiker:</h5>
                      {currentBooking.receiver_contact_info.name && (
                        <div>
                          <span className="font-medium">Navn: </span>
                          {currentBooking.receiver_contact_info.name}
                        </div>
                      )}
                      {currentBooking.receiver_contact_info.email && (
                        <div>
                          <span className="font-medium">E-post: </span>
                          <a href={`mailto:${currentBooking.receiver_contact_info.email}`} className="text-primary hover:underline">
                            {currentBooking.receiver_contact_info.email}
                          </a>
                        </div>
                      )}
                      {currentBooking.receiver_contact_info.phone && (
                        <div>
                          <span className="font-medium">Telefon: </span>
                          <a href={`tel:${currentBooking.receiver_contact_info.phone}`} className="text-primary hover:underline">
                            {currentBooking.receiver_contact_info.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Agreement Confirmation */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              id="read-agreement"
              checked={hasReadAgreement}
              onCheckedChange={(checked) => setHasReadAgreement(checked === true)}
            />
            <label 
              htmlFor="read-agreement" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Jeg har lest og forstått hele avtalen
            </label>
          </div>

          <div className="flex gap-3">
            {!currentBooking[userConfirmedField] && (
              <Button 
                onClick={handleConfirmBooking}
                disabled={!hasReadAgreement}
              >
                <Check className="h-4 w-4 mr-2" />
                Godkjenn avtale
              </Button>
            )}

            {currentBooking[userConfirmedField] && !currentBooking[otherUserConfirmedField] && (
              <Badge variant="outline">
                Venter på godkjenning fra den andre parten
              </Badge>
            )}

            {canCreateEvent && (
              <Button 
                onClick={() => navigate(`/create-event?bookingId=${currentBooking.id}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Opprett arrangement
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
