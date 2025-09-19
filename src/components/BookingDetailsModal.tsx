import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Users, X, CreditCard, DollarSign, Phone, Mail, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
interface BookingData {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  event_date?: string;
  time?: string;
  ticket_price?: number;
  artist_fee?: number;
  audience_estimate?: number;
  sender_id: string;
  receiver_id: string;
  sender_contact_info?: any;
  status: string;
  personal_message?: string;
  hospitality_rider?: string;
  tech_spec?: string;
  door_deal?: boolean;
  door_percentage?: number;
  by_agreement?: boolean;
  created_at: string;
  published_at?: string;
}
interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  currentUserId?: string;
  isOwner?: boolean;
}
export const BookingDetailsModal = ({
  isOpen,
  onClose,
  bookingId,
  currentUserId,
  isOwner = false
}: BookingDetailsModalProps) => {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!bookingId || !isOpen) {
      setBooking(null);
      return;
    }
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const {
          data,
          error
        } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        if (error) throw error;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingData();
  }, [bookingId, isOpen]);
  if (!booking) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 text-center">
            {loading ? 'Laster arrangement...' : 'Arrangement ikke funnet'}
          </div>
        </DialogContent>
      </Dialog>;
  }
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE d. MMMM yyyy', {
        locale: nb
      });
    } catch {
      return dateString;
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{booking.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{booking.status}</Badge>
                {isOwner && <Badge variant="outline">Ditt arrangement</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Rediger
                </Button>}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {booking.description && <Card>
              <CardHeader>
                <CardTitle>Beskrivelse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{booking.description}</p>
              </CardContent>
            </Card>}

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Arrangementdetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.event_date && <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Dato</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.event_date)}
                      </p>
                    </div>
                  </div>}
                
                {booking.time && booking.time !== 'Ved avtale' && <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Klokkeslett</p>
                      <p className="text-sm text-muted-foreground">{booking.time}</p>
                    </div>
                  </div>}
              </div>

              {/* Venue */}
              {booking.venue && booking.venue !== 'Ved avtale' && <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sted</p>
                    <p className="text-sm text-muted-foreground">{booking.venue}</p>
                  </div>
                </div>}

              {/* Public Info - Ticket Price and Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.ticket_price && <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Billettpris</p>
                      <p className="text-sm text-muted-foreground">{booking.ticket_price} kr</p>
                    </div>
                  </div>}
                
                {booking.audience_estimate && <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Forventet publikum</p>
                      <p className="text-sm text-muted-foreground">{booking.audience_estimate} personer</p>
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Owner-only Information */}
          {isOwner && <>
              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Økonomiske detaljer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.artist_fee && <div className="flex items-center justify-between">
                      <span className="font-medium">Artist honorar:</span>
                      <span>{booking.artist_fee} kr</span>
                    </div>}
                  
                  {booking.door_deal && <div className="flex items-center justify-between">
                      <span className="font-medium">Door deal:</span>
                      <span>{booking.door_percentage}% av inntekter</span>
                    </div>}
                  
                  {booking.by_agreement && <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Pris etter avtale</span>
                    </div>}
                </CardContent>
              </Card>

              {/* Contact Information */}
              {booking.sender_contact_info && <Card>
                  <CardHeader>
                    <CardTitle>Kontaktinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {booking.sender_contact_info.phone && <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.sender_contact_info.phone}</span>
                      </div>}
                    {booking.sender_contact_info.email && <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.sender_contact_info.email}</span>
                      </div>}
                  </CardContent>
                </Card>}

              {/* Personal Message */}
              {booking.personal_message && <Card>
                  <CardHeader>
                    <CardTitle>Personlig melding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{booking.personal_message}</p>
                  </CardContent>
                </Card>}
            </>}

          {/* Public Action for Non-Owners */}
          {!isOwner}
        </div>
      </DialogContent>
    </Dialog>;
};