import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/hooks/useBookings';
import { useBookingChanges } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Check, X, AlertTriangle, Calendar, MapPin, DollarSign, Eye, Bell, User } from 'lucide-react';
import { format } from 'date-fns';

interface BookingConfirmationProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';

export const BookingConfirmation = ({ booking, isOpen, onClose, currentUserId }: BookingConfirmationProps) => {
  const [hasReadChanges, setHasReadChanges] = useState(false);
  const [realtimeBooking, setRealtimeBooking] = useState(booking);
  const { updateBooking } = useBookings();
  const { changes } = useBookingChanges(booking?.id);
  const { toast } = useToast();

  // Use realtime booking data
  const currentBooking = realtimeBooking || booking;
  const isSender = currentUserId === currentBooking?.sender_id;
  const isReceiver = currentUserId === currentBooking?.receiver_id;
  const userConfirmedField = isSender ? 'sender_confirmed' : 'receiver_confirmed';
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserConfirmedField = isSender ? 'receiver_confirmed' : 'sender_confirmed';
  const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';

  useEffect(() => {
    if (isOpen) {
      setHasReadChanges(false);
      setRealtimeBooking(booking);
    }
  }, [isOpen, booking]);

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!booking?.id) return;

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
          const updatedBooking = payload.new;
          setRealtimeBooking(prev => ({ ...prev, ...updatedBooking }));
          
          // Show notification when other party confirms
          const isSender = currentUserId === booking.sender_id;
          const otherUserConfirmedField = isSender ? 'receiver_confirmed' : 'sender_confirmed';
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, currentUserId, booking?.sender_confirmed, booking?.receiver_confirmed, booking?.sender_read_agreement, booking?.receiver_read_agreement, toast]);

  const unacknowledgedChanges = changes.filter(change => {
    return change.status === 'pending' && change.changed_by !== currentUserId;
  });

  const handleReadChanges = async () => {
    // Mark all pending changes as accepted since user has read them
    setHasReadChanges(true);
    toast({
      title: "Endringer lest",
      description: "Du har bekreftet at du har lest alle endringer",
    });
  };

  const handleConfirmBooking = async () => {
    try {
      await updateBooking(currentBooking.id, { 
        [userConfirmedField]: true,
        status: 'confirmed'
      });
      
      toast({
        title: "Booking bekreftet",
        description: "Du har bekreftet bookingen",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReadAgreement = async () => {
    try {
      await updateBooking(currentBooking.id, { [userReadField]: true });
      
      toast({
        title: "Avtale lest",
        description: "Du har bekreftet at du har lest avtalen",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePublishAgreement = async () => {
    // This function is deprecated - use BookingAgreement component instead
    toast({
      title: "Bruk avtalevisning",
      description: "Vennligst bruk den nye avtalefunksjonaliteten for publisering",
      variant: "default",
    });
  };

  if (!currentBooking) return null;

  const bothConfirmed = currentBooking.sender_confirmed && currentBooking.receiver_confirmed;
  const bothReadAgreement = currentBooking.sender_read_agreement && currentBooking.receiver_read_agreement;
  const canPublish = bothConfirmed && bothReadAgreement;
  const hasUnreadChanges = unacknowledgedChanges.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Bookingbekreftelse - {currentBooking.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Status oversikt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {currentBooking.sender_confirmed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Avsender bekreftet</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentBooking.receiver_confirmed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Mottaker bekreftet</span>
                </div>

                <div className="flex items-center gap-2">
                  {currentBooking.sender_read_agreement ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Avsender har lest avtale</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentBooking.receiver_read_agreement ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Mottaker har lest avtale</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes Alert */}
          {hasUnreadChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Det er {unacknowledgedChanges.length} endring(er) som må bekreftes før du kan gå videre.
              </AlertDescription>
            </Alert>
          )}

          {/* Changes List */}
          {unacknowledgedChanges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Endringer som må bekreftes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unacknowledgedChanges.map((change) => (
                  <div key={change.id} className="p-3 border rounded bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="font-medium">{change.field_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Endret fra "{change.old_value || 'ikke satt'}" til "{change.new_value || 'ikke satt'}"
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(change.change_timestamp), 'dd.MM.yyyy HH:mm')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Info (for receivers) */}
          {isReceiver && currentBooking.sender_contact_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Kontaktinformasjon fra avsender
                </CardTitle>
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

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endelige arrangementsdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Tittel</h3>
                <p>{currentBooking.title}</p>
              </div>
              
              {currentBooking.description && (
                <div>
                  <h3 className="font-medium mb-2">Beskrivelse</h3>
                  <p className="whitespace-pre-line">{currentBooking.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentBooking.event_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(currentBooking.event_date), 'dd.MM.yyyy')}</span>
                  </div>
                )}
                
                {currentBooking.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{currentBooking.venue}</span>
                  </div>
                )}
              </div>

              {(currentBooking.price_musician || currentBooking.price_ticket) && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pris
                  </h3>
                  <div className="space-y-1">
                    {currentBooking.price_musician && (
                      <p>Musiker: {currentBooking.price_musician}</p>
                    )}
                    {currentBooking.price_ticket && (
                      <p>Billett: {currentBooking.price_ticket}</p>
                    )}
                  </div>
                </div>
              )}

          {/* Documents */}
          <BookingDocumentViewer
            techSpec={currentBooking.tech_spec}
            hospitalityRider={currentBooking.hospitality_rider}
            bookingStatus={currentBooking.status}
            isVisible={true} // Always visible in confirmation dialog
          />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {hasUnreadChanges && !hasReadChanges && (
              <Button onClick={handleReadChanges}>
                <Check className="h-4 w-4 mr-2" />
                Jeg har lest alle endringene
              </Button>
            )}

            {(!hasUnreadChanges || hasReadChanges) && !currentBooking[userConfirmedField] && (
              <Button onClick={handleConfirmBooking}>
                <Check className="h-4 w-4 mr-2" />
                Bekreft booking
              </Button>
            )}

            {currentBooking[userConfirmedField] && !currentBooking[otherUserConfirmedField] && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Venter på at den andre parten bekrefter
              </Badge>
            )}

            {bothConfirmed && !currentBooking[userReadField] && (
              <Button onClick={handleReadAgreement}>
                <Check className="h-4 w-4 mr-2" />
                Jeg har lest avtalen
              </Button>
            )}

            {currentBooking[userReadField] && !currentBooking[otherUserReadField] && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Venter på at den andre parten leser avtalen
              </Badge>
            )}

            {canPublish && (
              <Button onClick={handlePublishAgreement} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
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