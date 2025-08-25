import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Check, Eye, Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface BookingAgreementProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingAgreement = ({ booking, isOpen, onClose, currentUserId }: BookingAgreementProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [userHasRead, setUserHasRead] = useState(false);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking.sender_id;
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setUserHasRead(booking[userReadField] || false);
    }
  }, [isOpen, booking, userReadField]);

  const handleScroll = (event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await updateBooking(booking.id, { [userReadField]: true });
      setUserHasRead(true);
      
      toast({
        title: "Avtale lest",
        description: "Du har bekreftet at du har lest hele avtalen",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePublishAgreement = async () => {
    try {
      await updateBooking(booking.id, { 
        status: 'published',
        selected_concept_id: booking.selected_concept_id || booking.concept_ids[0]
      });
      
      toast({
        title: "Avtale publisert",
        description: "Arrangementet er nå offentlig tilgjengelig",
      });
      
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!booking) return null;

  const bothHaveRead = booking.sender_read_agreement && booking.receiver_read_agreement;
  const bothHaveConfirmed = booking.sender_confirmed && booking.receiver_confirmed;
  const canPublish = bothHaveRead && bothHaveConfirmed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Avtalebekreftelse - {booking.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea 
          className="h-[50vh] p-4"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arrangementsdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Tittel</h3>
                  <p>{booking.title}</p>
                </div>
                
                {booking.description && (
                  <div>
                    <h3 className="font-medium mb-2">Beskrivelse</h3>
                    <p>{booking.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(booking.event_date), 'dd.MM.yyyy')}</span>
                    </div>
                  )}
                  
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.venue}</span>
                    </div>
                  )}
                </div>

                {(booking.price_musician || booking.price_ticket) && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pris
                    </h3>
                    <div className="space-y-1">
                      {booking.price_musician && (
                        <p>Musiker: {booking.price_musician}</p>
                      )}
                      {booking.price_ticket && (
                        <p>Billett: {booking.price_ticket}</p>
                      )}
                    </div>
                  </div>
                )}

                {booking.hospitality_rider && (
                  <div>
                    <h3 className="font-medium mb-2">Hospitality Rider</h3>
                    <p>{booking.hospitality_rider}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legal Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vilkår og betingelser</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>Ved å godta denne avtalen forplikter begge parter seg til:</p>
                <ul>
                  <li>Å respektere alle avtalte tidspunkter og frister</li>
                  <li>Å opprettholde profesjonell kommunikasjon</li>
                  <li>Å overholde alle spesifiserte tekniske krav</li>
                  <li>Å respektere opphavsrett og immaterielle rettigheter</li>
                  <li>Å gi minst 48 timers varsel ved eventuelle endringer</li>
                </ul>
                
                <p>Avlysning:</p>
                <ul>
                  <li>Ved avlysning mindre enn 7 dager før arrangement kan det påløpe kostnader</li>
                  <li>Ved force majeure (værforhold, sykdom, etc.) kan avtalen endres i fellesskap</li>
                </ul>

                <p>Denne avtalen er bindende når begge parter har bekreftet og publisert.</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Status and Actions */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {booking.sender_read_agreement ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 border rounded" />
                )}
                <span>Avsender har lest</span>
              </div>
              
              <div className="flex items-center gap-2">
                {booking.receiver_read_agreement ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 border rounded" />
                )}
                <span>Mottaker har lest</span>
              </div>
            </div>
            
            <Badge variant={bothHaveRead ? "default" : "secondary"}>
              {bothHaveRead ? "Begge har lest" : "Venter på lesing"}
            </Badge>
          </div>

          <div className="flex gap-3">
            {!userHasRead && (
              <Button 
                onClick={handleMarkAsRead}
                disabled={!hasScrolledToBottom}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {hasScrolledToBottom ? "Jeg har lest alt" : "Rull ned for å lese alt"}
              </Button>
            )}
            
            {userHasRead && !booking[otherUserReadField] && (
              <Badge variant="outline">Venter på at den andre parten leser avtalen</Badge>
            )}
            
            {canPublish && (
              <Button onClick={handlePublishAgreement} className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Publiser arrangement
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