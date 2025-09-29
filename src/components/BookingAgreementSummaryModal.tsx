import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Banknote, Users, FileText, Music, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingAgreementSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  currentUserId: string;
}

export const BookingAgreementSummaryModal = ({
  isOpen,
  onClose,
  booking,
  currentUserId
}: BookingAgreementSummaryModalProps) => {
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && booking) {
      loadDetails();
    }
  }, [isOpen, booking]);

  const loadDetails = async () => {
    try {
      setLoading(true);

      // Load selected concept if available
      if (booking.selected_concept_id) {
        const { data: conceptData } = await supabase
          .from('concepts')
          .select('*')
          .eq('id', booking.selected_concept_id)
          .single();
        
        if (conceptData) setSelectedConcept(conceptData);
      }

      // Load profiles
      const { data: senderData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', booking.sender_id)
        .single();
      
      const { data: receiverData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', booking.receiver_id)
        .single();

      if (senderData) setSenderProfile(senderData);
      if (receiverData) setReceiverProfile(receiverData);

    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch {
      return dateString;
    }
  };

  const isSender = currentUserId === booking.sender_id;
  const isReceiver = currentUserId === booking.receiver_id;
  const canSeeContactInfo = booking.status !== 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] p-0 flex flex-col">
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-4 py-4 md:px-6 shrink-0">
          <DialogTitle className="text-xl md:text-2xl">Avtaledetaljer</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Header Info */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">{booking.title}</CardTitle>
                  {booking.description && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{booking.description}</p>
                  )}
                </CardHeader>
              </Card>

              {/* Parties Involved */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    Parter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {senderProfile?.avatar_url && (
                        <img 
                          src={senderProfile.avatar_url} 
                          alt={senderProfile.display_name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{senderProfile?.display_name || 'Arrangør'}</p>
                        <p className="text-xs text-muted-foreground">Arrangør</p>
                      </div>
                    </div>
                    {isSender && <Badge variant="secondary" className="shrink-0 text-xs">Deg</Badge>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {receiverProfile?.avatar_url && (
                        <img 
                          src={receiverProfile.avatar_url} 
                          alt={receiverProfile.display_name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{receiverProfile?.display_name || 'Artist'}</p>
                        <p className="text-xs text-muted-foreground">Artist</p>
                      </div>
                    </div>
                    {isReceiver && <Badge variant="secondary" className="shrink-0 text-xs">Deg</Badge>}
                  </div>
                </CardContent>
              </Card>

              {/* Event Details */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                    Arrangement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                  {booking.event_date && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base break-words">
                        {formatDate(booking.event_date)} {booking.time && `kl. ${booking.time}`}
                      </span>
                    </div>
                  )}
                  {booking.venue && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base break-words">{booking.venue}</span>
                    </div>
                  )}
                  {booking.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm text-muted-foreground break-words">{booking.address}</span>
                    </div>
                  )}
                  {booking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm md:text-base">Forventet publikum: {booking.audience_estimate} personer</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Agreement */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Banknote className="h-4 w-4 md:h-5 md:w-5" />
                    Avtalt pris
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                  {booking.price_musician && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Artisthonorar</p>
                      <p className="font-medium text-sm md:text-base">{booking.price_musician}</p>
                    </div>
                  )}
                  {booking.artist_fee && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Garantert honorar</p>
                      <p className="font-medium text-sm md:text-base">{booking.artist_fee} kr</p>
                    </div>
                  )}
                  {booking.door_deal && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Døravtale</p>
                      <p className="font-medium text-sm md:text-base">{booking.door_percentage}% av dør</p>
                    </div>
                  )}
                  {booking.ticket_price && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Billettpris</p>
                      <p className="font-medium text-sm md:text-base">{booking.ticket_price} kr</p>
                    </div>
                  )}
                  {booking.by_agreement && (
                    <Badge variant="outline" className="text-xs">Etter avtale</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Selected Concept */}
              {selectedConcept && (
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Music className="h-4 w-4 md:h-5 md:w-5" />
                      Valgt konsept
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                    <p className="font-medium text-sm md:text-base">{selectedConcept.title}</p>
                    {selectedConcept.description && (
                      <p className="text-xs md:text-sm text-muted-foreground break-words">{selectedConcept.description}</p>
                    )}
                    {selectedConcept.expected_audience && (
                      <p className="text-xs md:text-sm">Forventet publikum: {selectedConcept.expected_audience} personer</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tech Specs & Hospitality */}
              {(booking.tech_spec || booking.hospitality_rider) && (
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 md:h-5 md:w-5" />
                      Tekniske krav
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 md:p-6 pt-0">
                    {booking.tech_spec && (
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-1">Tech Spec</p>
                        <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-wrap break-words">{booking.tech_spec}</p>
                      </div>
                    )}
                    {booking.hospitality_rider && (
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-1">Hospitality Rider</p>
                        <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-wrap break-words">{booking.hospitality_rider}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Personal Message */}
              {booking.personal_message && canSeeContactInfo && (
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                      Personlig melding
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{booking.personal_message}</p>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              {booking.sender_contact_info && canSeeContactInfo && (
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg">Kontaktinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                    {booking.sender_contact_info.email && (
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">E-post</p>
                        <p className="font-medium text-sm md:text-base break-all">{booking.sender_contact_info.email}</p>
                      </div>
                    )}
                    {booking.sender_contact_info.phone && (
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium text-sm md:text-base">{booking.sender_contact_info.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Agreement Status */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Avtalestatus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs md:text-sm">Arrangør godkjent</span>
                    <Badge variant={booking.approved_by_sender ? "default" : "secondary"} className="text-xs shrink-0">
                      {booking.approved_by_sender ? "Godkjent" : "Venter"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs md:text-sm">Artist godkjent</span>
                    <Badge variant={booking.approved_by_receiver ? "default" : "secondary"} className="text-xs shrink-0">
                      {booking.approved_by_receiver ? "Godkjent" : "Venter"}
                    </Badge>
                  </div>
                  {booking.sender_approved_at && (
                    <p className="text-xs text-muted-foreground">
                      Arrangør godkjent: {formatDate(booking.sender_approved_at)}
                    </p>
                  )}
                  {booking.receiver_approved_at && (
                    <p className="text-xs text-muted-foreground">
                      Artist godkjent: {formatDate(booking.receiver_approved_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
