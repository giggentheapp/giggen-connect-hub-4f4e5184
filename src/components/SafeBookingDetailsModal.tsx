import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Banknote, Clock, Phone, Mail, FileText } from 'lucide-react';
import { SafeBooking, useBookingsSafe } from '@/hooks/useBookingsSafe';
import { useToast } from '@/hooks/use-toast';

interface SafeBookingDetailsModalProps {
  booking: SafeBooking | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const SafeBookingDetailsModal = ({
  booking,
  isOpen,
  onClose,
  currentUserId
}: SafeBookingDetailsModalProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Partial<SafeBooking>>({});
  const { updateBooking } = useBookingsSafe();
  const { toast } = useToast();

  useEffect(() => {
    if (booking) {
      setEditedBooking(booking);
    }
  }, [booking]);

  if (!booking) return null;

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const canEdit = booking.status === 'allowed' || booking.status === 'approved_by_both';

  // Safe date formatter
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('nb-NO');
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    try {
      await updateBooking(booking.id, editedBooking);
      setEditMode(false);
      toast({
        title: "Booking oppdatert",
        description: "Endringene er lagret",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const getPhaseInfo = () => {
    switch (booking.status) {
      case 'pending':
        return {
          phase: 'Fase 1: Første forespørsel',
          description: isSender ? 'Du venter på svar fra mottaker' : 'Du har mottatt en ny forespørsel',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'allowed':
        return {
          phase: 'Fase 2: Forhandling pågår',
          description: 'Begge parter kan redigere detaljer og forhandle vilkår',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'approved_by_both':
      case 'both_parties_approved':
        return {
          phase: 'Fase 2: Godkjent - klar for publisering',
          description: 'Begge parter har godkjent avtalen og kan publisere arrangementet',
          color: 'bg-purple-100 text-purple-800'
        };
      case 'upcoming':
        return {
          phase: 'Fase 3: Publisert arrangement',
          description: 'Arrangementet er publisert og synlig for andre',
          color: 'bg-green-100 text-green-800'
        };
      case 'completed':
        return {
          phase: 'Fase 4: Fullført arrangement',
          description: 'Arrangementet er gjennomført',
          color: 'bg-gray-100 text-gray-800'
        };
      default:
        return {
          phase: 'Ukjent fase',
          description: '',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {booking.title}
            <Badge className={phaseInfo.color}>
              {phaseInfo.phase}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{phaseInfo.description}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grunnleggende informasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode && canEdit ? (
                <>
                  <div>
                    <Label htmlFor="title">Tittel</Label>
                    <Input
                      id="title"
                      value={editedBooking.title || ''}
                      onChange={(e) => setEditedBooking(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Textarea
                      id="description"
                      value={editedBooking.description || ''}
                      onChange={(e) => setEditedBooking(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium">Tittel</h4>
                    <p>{booking.title}</p>
                  </div>
                  {booking.description && (
                    <div>
                      <h4 className="font-medium">Beskrivelse</h4>
                      <p className="text-sm">{booking.description}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arrangementdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode && canEdit ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_date">Dato</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={editedBooking.event_date ? editedBooking.event_date.split('T')[0] : ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, event_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Tid</Label>
                      <Input
                        id="time"
                        type="time"
                        value={editedBooking.time || ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={editedBooking.venue || ''}
                      onChange={(e) => setEditedBooking(prev => ({ ...prev, venue: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="audience_estimate">Forventet publikum</Label>
                      <Input
                        id="audience_estimate"
                        type="number"
                        value={editedBooking.audience_estimate || ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, audience_estimate: parseInt(e.target.value) || undefined }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket_price">Billettpris (kr)</Label>
                      <Input
                        id="ticket_price"
                        type="number"
                        value={editedBooking.ticket_price || ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, ticket_price: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {booking.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(booking.event_date)}</span>
                      {booking.time && <span className="text-muted-foreground">kl. {booking.time}</span>}
                    </div>
                  )}
                  
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.venue}</span>
                    </div>
                  )}
                  
                  {booking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.audience_estimate} personer</span>
                    </div>
                  )}
                  
                  {booking.ticket_price && (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.ticket_price} kr</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Details */}
          {(booking.artist_fee || booking.price_musician || editMode) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Økonomiske detaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode && canEdit ? (
                  <>
                    <div>
                      <Label htmlFor="artist_fee">Artisthonorar (kr)</Label>
                      <Input
                        id="artist_fee"
                        type="number"
                        value={editedBooking.artist_fee || ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, artist_fee: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price_musician">Ytterligere betingelser</Label>
                      <Textarea
                        id="price_musician"
                        value={editedBooking.price_musician || ''}
                        onChange={(e) => setEditedBooking(prev => ({ ...prev, price_musician: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {booking.artist_fee && (
                      <div>
                        <h4 className="font-medium">Artisthonorar</h4>
                        <p>{booking.artist_fee} kr</p>
                      </div>
                    )}
                    {booking.price_musician && (
                      <div>
                        <h4 className="font-medium">Betingelser</h4>
                        <p className="text-sm">{booking.price_musician}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Message */}
          {(booking.personal_message || editMode) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personlig melding</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode && canEdit ? (
                  <Textarea
                    value={editedBooking.personal_message || ''}
                    onChange={(e) => setEditedBooking(prev => ({ ...prev, personal_message: e.target.value }))}
                    rows={3}
                    placeholder="Legg til en personlig melding..."
                  />
                ) : (
                  <p className="text-sm">{booking.personal_message || 'Ingen personlig melding'}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Information - Only visible in allowed status and later */}
          {(booking.status !== 'pending' && booking.sender_contact_info) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kontaktinformasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.sender_contact_info?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.sender_contact_info.phone}</span>
                    </div>
                  )}
                  {booking.sender_contact_info?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.sender_contact_info.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {editMode ? (
              <>
                <Button onClick={handleSave}>
                  Lagre endringer
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Avbryt
                </Button>
              </>
            ) : (
              <>
                {canEdit && (isSender || isReceiver) && (
                  <Button onClick={() => setEditMode(true)}>
                    Rediger detaljer
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Lukk
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};