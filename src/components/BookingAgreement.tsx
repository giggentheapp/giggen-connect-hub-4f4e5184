import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import FileViewer from '@/components/FileViewer';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { Check, X, Calendar, MapPin, DollarSign, Users, FileText, Music } from 'lucide-react';
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';

  // Get maker's data for portfolio, tech specs, and hospitality riders
  const makerId = booking?.receiver_id; // Assuming receiver is the maker
  const { concepts } = useUserConcepts(makerId);
  const { files: techSpecFiles } = useProfileTechSpecs(makerId);
  const { files: hospitalityFiles } = useHospitalityRiders(makerId);

  // Get selected concept details
  const selectedConcept = concepts.find(c => c.id === booking?.selected_concept_id);

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setUserHasRead(false);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
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
      toast({
        title: "Feil ved markering",
        description: "Kunne ikke markere avtalen som lest",
        variant: "destructive",
      });
    }
  };

  const handlePublishAgreement = async () => {
    try {
      // Update booking status to published
      await updateBooking(booking.id, { status: 'published' });

      // Create event in events_market
      const eventDate = booking.event_date ? new Date(booking.event_date) : new Date();
      const eventData = {
        title: booking.title,
        description: booking.description,
        portfolio_id: booking.selected_concept_id,
        ticket_price: booking.price_ticket ? parseFloat(booking.price_ticket.replace(/[^\d.]/g, '')) || null : null,
        venue: booking.venue,
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().split(' ')[0],
        event_datetime: eventDate.toISOString(),
        expected_audience: selectedConcept?.expected_audience || null,
        created_by: currentUserId,
        is_public: true // Make public by default
      };

      const { error: eventError } = await supabase
        .from("events_market")
        .insert([eventData]);

      if (eventError) {
        console.error('Error creating event in market:', eventError);
        toast({
          title: "Arrangement publisert",
          description: "Arrangementet er publisert, men kunne ikke legges til i markedet automatisk",
        });
      } else {
        toast({
          title: "Arrangement publisert",
          description: "Arrangementet er nå publisert og tilgjengelig for alle!",
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Feil ved publisering",
        description: "Kunne ikke publisere arrangementet",
        variant: "destructive",
      });
    }
  };

  if (!booking) return null;

  const bothReadAgreement = booking.sender_read_agreement && booking.receiver_read_agreement;
  const canPublish = bothReadAgreement;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bookingavtale - {booking.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea 
          ref={scrollAreaRef}
          className="h-[70vh] pr-4"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-6">
            {/* Agreement Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avtale status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {booking.sender_read_agreement ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>Avsender har lest avtale</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {booking.receiver_read_agreement ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>Mottaker har lest avtale</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Arrangementsdetaljer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{booking.title}</h3>
                  {booking.description && (
                    <p className="text-muted-foreground mb-4">{booking.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(booking.event_date), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                  )}
                  
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{booking.venue}</span>
                    </div>
                  )}

                  {selectedConcept?.expected_audience && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Forventet publikum: {selectedConcept.expected_audience}</span>
                    </div>
                  )}
                </div>

                {(booking.price_musician || booking.price_ticket) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Prising
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {booking.price_musician && (
                        <div>
                          <span className="text-sm text-muted-foreground">Musiker honorar:</span>
                          <p className="font-medium">{booking.price_musician}</p>
                        </div>
                      )}
                      {booking.price_ticket && (
                        <div>
                          <span className="text-sm text-muted-foreground">Billettpris:</span>
                          <p className="font-medium">{booking.price_ticket}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Concept */}
            {selectedConcept && (
              <Card>
                <CardHeader>
                  <CardTitle>Valgt konsept</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{selectedConcept.title}</h4>
                      {selectedConcept.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedConcept.description}</p>
                      )}
                    </div>
                    {selectedConcept.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Pris: {selectedConcept.price} kr</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {makerId && (
              <Card>
                <CardHeader>
                  <CardTitle>Portefølje</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfilePortfolioViewer userId={makerId} />
                </CardContent>
              </Card>
            )}

            {/* Tech Specs */}
            {techSpecFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tekniske spesifikasjoner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {techSpecFiles.map((file) => (
                      <div key={file.id} className="p-3 border rounded">
                        <a 
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {file.filename}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hospitality Rider */}
            {hospitalityFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hospitality Rider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {hospitalityFiles.map((file) => (
                      <div key={file.id} className="p-3 border rounded">
                        <a 
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {file.filename}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.hospitality_rider && (
              <Card>
                <CardHeader>
                  <CardTitle>Hospitality Rider (tekst)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{booking.hospitality_rider}</p>
                </CardContent>
              </Card>
            )}

            {/* Legal Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Juridiske vilkår</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded bg-muted/50">
                  <h4 className="font-medium mb-2">Avtalevilkår</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Begge parter er forpliktet til å overholde de avtalevilkår som er spesifisert i denne bookingen.</p>
                    <p>• Eventuell kansellering må skje i rimelig tid og i samsvar med gjeldende lover og regler.</p>
                    <p>• Alle priser er inkludert mva der det er aktuelt.</p>
                    <p>• Tekniske spesifikasjoner og hospitality rider må overholdes av arrangør.</p>
                    <p>• Ved publisering blir arrangementet synlig for allmennheten med offentlig informasjon.</p>
                  </div>
                </div>
                
                <div className="p-4 border rounded bg-orange-50 dark:bg-orange-950/20">
                  <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">Viktig informasjon</h4>
                  <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                    <p>• Når arrangementet publiseres, vil følgende informasjon bli synlig for allmennheten:</p>
                    <p className="ml-4">- Tittel og beskrivelse</p>
                    <p className="ml-4">- Dato, klokkeslett og sted</p>
                    <p className="ml-4">- Billettpris (hvis satt)</p>
                    <p className="ml-4">- Portefølje og forventet publikum</p>
                    <p>• Sensitiv informasjon som musiker honorar, tech spec og hospitality rider forblir privat.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {!booking[userReadField] && (
            <div className="flex items-center gap-3">
              <Checkbox
                id="read-agreement"
                checked={hasScrolledToBottom && userHasRead}
                disabled={!hasScrolledToBottom}
                onCheckedChange={() => {}}
              />
              <Button 
                onClick={handleMarkAsRead}
                disabled={!hasScrolledToBottom || userHasRead}
                variant={hasScrolledToBottom ? "default" : "secondary"}
              >
                <Check className="h-4 w-4 mr-2" />
                Jeg har lest alt
              </Button>
              {!hasScrolledToBottom && (
                <span className="text-sm text-muted-foreground">
                  Scroll ned for å lese hele avtalen
                </span>
              )}
            </div>
          )}

          {booking[userReadField] && !booking[otherUserReadField] && (
            <Badge variant="outline">Venter på at den andre parten leser avtalen</Badge>
          )}

          {canPublish && (
            <Button 
              onClick={handlePublishAgreement} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Publiser arrangement
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};