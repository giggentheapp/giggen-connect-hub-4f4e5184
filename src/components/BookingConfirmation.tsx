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
import { Check, X, AlertTriangle, Calendar, MapPin, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface BookingConfirmationProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingConfirmation = ({ booking, isOpen, onClose, currentUserId }: BookingConfirmationProps) => {
  const [hasReadChanges, setHasReadChanges] = useState(false);
  const { updateBooking } = useBookings();
  const { changes } = useBookingChanges(booking?.id);
  const { toast } = useToast();

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const userConfirmedField = isSender ? 'sender_confirmed' : 'receiver_confirmed';
  const userReadField = isSender ? 'sender_read_agreement' : 'receiver_read_agreement';
  const otherUserConfirmedField = isSender ? 'receiver_confirmed' : 'sender_confirmed';
  const otherUserReadField = isSender ? 'receiver_read_agreement' : 'sender_read_agreement';

  useEffect(() => {
    if (isOpen) {
      setHasReadChanges(false);
    }
  }, [isOpen]);

  const unacknowledgedChanges = changes.filter(change => {
    if (isSender && !change.acknowledged_by_sender) return true;
    if (isReceiver && !change.acknowledged_by_receiver) return true;
    return false;
  });

  const handleReadChanges = async () => {
    try {
      // Mark all changes as acknowledged
      for (const change of unacknowledgedChanges) {
        const updateField = isSender ? 'acknowledged_by_sender' : 'acknowledged_by_receiver';
        await supabase
          .from('booking_changes')
          .update({ [updateField]: true })
          .eq('id', change.id);
      }
      
      setHasReadChanges(true);
      toast({
        title: "Endringer lest",
        description: "Du har bekreftet at du har lest alle endringer",
      });
    } catch (error: any) {
      toast({
        title: "Feil ved markering av endringer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmBooking = async () => {
    try {
      await updateBooking(booking.id, { 
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
      await updateBooking(booking.id, { [userReadField]: true });
      
      toast({
        title: "Avtale lest",
        description: "Du har bekreftet at du har lest avtalen",
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePublishAgreement = async () => {
    try {
      await updateBooking(booking.id, { status: 'published' });
      
      toast({
        title: "Arrangement publisert",
        description: "Arrangementet er nå offentlig tilgjengelig",
      });
      
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!booking) return null;

  const bothConfirmed = booking.sender_confirmed && booking.receiver_confirmed;
  const bothReadAgreement = booking.sender_read_agreement && booking.receiver_read_agreement;
  const canPublish = bothConfirmed && bothReadAgreement;
  const hasUnreadChanges = unacknowledgedChanges.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Bookingbekreftelse - {booking.title}
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
                  {booking.sender_confirmed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Avsender bekreftet</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {booking.receiver_confirmed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Mottaker bekreftet</span>
                </div>

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

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endelige arrangementsdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Tittel</h3>
                <p>{booking.title}</p>
              </div>
              
              {booking.description && (
                <div>
                  <h3 className="font-medium mb-2">Beskrivelse</h3>
                  <p className="whitespace-pre-line">{booking.description}</p>
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
                  <p className="whitespace-pre-line">{booking.hospitality_rider}</p>
                </div>
              )}
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

            {(!hasUnreadChanges || hasReadChanges) && !booking[userConfirmedField] && (
              <Button onClick={handleConfirmBooking}>
                <Check className="h-4 w-4 mr-2" />
                Bekreft booking
              </Button>
            )}

            {booking[userConfirmedField] && !booking[otherUserConfirmedField] && (
              <Badge variant="outline">Venter på at den andre parten bekrefter</Badge>
            )}

            {bothConfirmed && !booking[userReadField] && (
              <Button onClick={handleReadAgreement}>
                <Check className="h-4 w-4 mr-2" />
                Jeg har lest avtalen
              </Button>
            )}

            {booking[userReadField] && !booking[otherUserReadField] && (
              <Badge variant="outline">Venter på at den andre parten leser avtalen</Badge>
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