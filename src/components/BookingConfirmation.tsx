import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Check, X, AlertTriangle, Calendar, MapPin, Banknote, Users, FileText, Music, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface BookingConfirmationProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
import { BookingPublicPreview } from '@/components/BookingPublicPreview';

export const BookingConfirmation = ({ booking, isOpen, onClose, currentUserId }: BookingConfirmationProps) => {
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [realtimeBooking, setRealtimeBooking] = useState(booking);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [makerProfile, setMakerProfile] = useState(null);
  const { updateBooking } = useBookings();
  const { toast } = useToast();

  // Use realtime booking data
  const currentBooking = realtimeBooking || booking;
  const isSender = currentUserId === currentBooking?.sender_id;
  const isReceiver = currentUserId === currentBooking?.receiver_id;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';
  const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';

  useEffect(() => {
    if (isOpen) {
      setHasReadAgreement(false);
      setRealtimeBooking(booking);
      
      // Load maker profile
      const loadMakerProfile = async () => {
        if (booking?.receiver_id) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('display_name, avatar_url, bio')
              .eq('user_id', booking.receiver_id)
              .maybeSingle();
            if (data) {
              setMakerProfile(data);
            }
          } catch (error) {
            console.error('Error loading maker profile:', error);
          }
        }
      };
      
      loadMakerProfile();
    }
  }, [isOpen, booking]);

  // Enhanced real-time subscription with better error handling for mobile
  useEffect(() => {
    if (!booking?.id) return;
    
    const isMobileOrSafari = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                           /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Skip real-time subscriptions on mobile/Safari to prevent crashes
    if (isMobileOrSafari) {
      return;
    }

    const channel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`
        },
        (payload) => {
          try {
            const updatedBooking = payload.new;
            setRealtimeBooking(prev => ({ ...prev, ...updatedBooking }));
            
            // Show notification when other party confirms
            const isSender = currentUserId === booking.sender_id;
            const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';
            const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';
            
            if (updatedBooking[otherUserConfirmedField] && !booking[otherUserConfirmedField]) {
              toast({
                title: "Booking bekreftet! 🎉",
                description: "Den andre parten har bekreftet bookingen",
              });
            }
            
            if (updatedBooking[otherUserReadField] && !booking[otherUserReadField]) {
              toast({
                title: "Avtale lest! 📋",
                description: "Den andre parten har lest avtalen",
              });
            }
          } catch (error) {
            console.warn('Error handling real-time update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    };
  }, [booking?.id, currentUserId, booking?.sender_confirmed, booking?.receiver_confirmed, booking?.sender_read_agreement, booking?.receiver_read_agreement, toast]);


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

      // If both have now confirmed, show preview with fresh data
      if (currentBooking[otherUserConfirmedField]) {
        await handleShowPublicPreview();
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleShowPublicPreview = async () => {
    try {
      // Fetch fresh booking data from database to ensure we show the latest revised details
      const { data: freshBooking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', currentBooking.id)
        .single();
      
      if (error) throw error;
      
      if (freshBooking) {
        setRealtimeBooking(freshBooking);
      }
      
      setShowPublicPreview(true);
    } catch (error) {
      console.error('Error fetching fresh booking data:', error);
      toast({
        title: "Kunne ikke laste booking",
        description: "Prøv igjen",
        variant: "destructive",
      });
    }
  };

  const handlePublishEvent = async () => {
    try {
      // Update booking status to published
      await updateBooking(currentBooking.id, { status: 'upcoming' });

      // Create event in events_market
      const eventDate = currentBooking.event_date ? new Date(currentBooking.event_date) : new Date();
      const eventData = {
        title: currentBooking.title,
        description: currentBooking.description,
        portfolio_id: currentBooking.selected_concept_id,
        ticket_price: currentBooking.ticket_price || null,
        venue: currentBooking.venue,
        date: eventDate.toISOString().split('T')[0],
        time: currentBooking.time || eventDate.toTimeString().split(' ')[0],
        event_datetime: eventDate.toISOString(),
        expected_audience: currentBooking.audience_estimate || null,
        created_by: currentUserId,
        is_public: true
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
          title: "Arrangement publisert! 🎉",
          description: "Arrangementet er nå synlig for alle i Goer-appen",
        });
      }

      setShowPublicPreview(false);
      onClose();
    } catch (error) {
      toast({
        title: "Feil ved publisering",
        description: "Kunne ikke publisere arrangementet",
        variant: "destructive",
      });
    }
  };

  if (!currentBooking) return null;

  const bothConfirmed = currentBooking.approved_by_sender && currentBooking.approved_by_receiver;
  const bothReadAgreement = currentBooking.sender_read_agreement && currentBooking.receiver_read_agreement;
  const canShowPreview = bothConfirmed && bothReadAgreement;

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

            {/* Contact Info (for receivers) */}
            {isReceiver && currentBooking.sender_contact_info && (
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformasjon fra arrangør</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentBooking.sender_contact_info.name && (
                    <div>
                      <span className="font-medium">Navn: </span>
                      {currentBooking.sender_contact_info.name}
                    </div>
                  )}
                  {currentBooking.sender_contact_info.email && (
                    <div>
                      <span className="font-medium">E-post: </span>
                      {currentBooking.sender_contact_info.email}
                    </div>
                  )}
                  {currentBooking.sender_contact_info.phone && (
                    <div>
                      <span className="font-medium">Telefon: </span>
                      {currentBooking.sender_contact_info.phone}
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

            {canShowPreview && !showPublicPreview && (
              <Button 
                onClick={handleShowPublicPreview}
                className="bg-green-600 hover:bg-green-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Forhåndsvis og publiser
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Public Preview Dialog */}
      <BookingPublicPreview
        booking={currentBooking}
        makerProfile={makerProfile}
        isOpen={showPublicPreview}
        onClose={() => setShowPublicPreview(false)}
        onPublish={handlePublishEvent}
      />
    </Dialog>
  );
};