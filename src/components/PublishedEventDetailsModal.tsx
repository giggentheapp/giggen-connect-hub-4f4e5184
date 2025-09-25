import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Banknote, User, Phone, Mail, Globe, FileText, Music } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface PublishedEventDetailsModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  showSensitiveInfo?: boolean;
}

export const PublishedEventDetailsModal = ({ 
  bookingId, 
  isOpen, 
  onClose, 
  currentUserId,
  showSensitiveInfo = false 
}: PublishedEventDetailsModalProps) => {
  const [booking, setBooking] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      // Fetch booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch profiles for both parties
      if (bookingData.sender_id) {
        const { data: senderData } = await supabase
          .rpc('get_secure_profile_data', { target_user_id: bookingData.sender_id })
          .maybeSingle();
        setSenderProfile(senderData);
      }

      if (bookingData.receiver_id) {
        const { data: receiverData } = await supabase
          .rpc('get_secure_profile_data', { target_user_id: bookingData.receiver_id })
          .maybeSingle();
        setReceiverProfile(receiverData);
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste arrangementdetaljer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster arrangementdetaljer...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center p-8">
            <p>Arrangement ikke funnet</p>
            <Button onClick={onClose} className="mt-4">Lukk</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isOwner = currentUserId === booking.sender_id || currentUserId === booking.receiver_id;
  const maker = booking.sender_id === currentUserId ? receiverProfile : senderProfile;
  const organizer = booking.sender_id === currentUserId ? senderProfile : receiverProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {booking.title}
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Publisert
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grunnleggende arrangementsinformasjon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Arrangementsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.description && (
                <div>
                  <h4 className="font-medium mb-2">Beskrivelse</h4>
                  <p className="text-muted-foreground">{booking.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.event_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      <strong>Dato:</strong> {format(new Date(booking.event_date), 'dd. MMMM yyyy', { locale: nb })}
                      {booking.time && ` kl. ${booking.time}`}
                    </span>
                  </div>
                )}

                {booking.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span><strong>Spillested:</strong> {booking.venue}</span>
                  </div>
                )}

                {booking.address && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span><strong>Adresse:</strong> {booking.address}</span>
                  </div>
                )}

                {booking.audience_estimate && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span><strong>Forventet publikum:</strong> {booking.audience_estimate} personer</span>
                  </div>
                )}

                {booking.ticket_price && (
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-primary" />
                    <span><strong>Billettpris:</strong> {booking.ticket_price} kr</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Økonomisk informasjon - kun for eiere */}
          {(isOwner || showSensitiveInfo) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Økonomiske detaljer
                  <Badge variant="outline" className="text-xs">Kun synlig for partene</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Artist honorar:</h4>
                    <p className="text-muted-foreground">
                      {booking.door_deal ? (
                        `${booking.door_percentage || 50}% av dørinntekter`
                      ) : booking.by_agreement ? (
                        'Avtales direkte mellom partene'
                      ) : (
                        `${booking.artist_fee || booking.price_musician || 'Ikke spesifisert'} kr`
                      )}
                    </p>
                  </div>

                  {booking.door_deal && booking.audience_estimate && booking.ticket_price && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h5 className="font-medium text-sm">Estimert inntekt:</h5>
                      <p className="text-sm text-muted-foreground">
                        Total billettsalg: {(booking.audience_estimate * booking.ticket_price).toLocaleString('nb-NO')} kr
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Artist andel ({booking.door_percentage}%): {Math.round((booking.audience_estimate * booking.ticket_price * (booking.door_percentage || 50)) / 100).toLocaleString('nb-NO')} kr
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kontaktinformasjon - kun for eiere */}
          {(isOwner || showSensitiveInfo) && (senderProfile?.contact_info || receiverProfile?.contact_info) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Kontaktinformasjon
                  <Badge variant="outline" className="text-xs">Kun synlig for partene</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {senderProfile?.contact_info && (
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {senderProfile.display_name} (Arrangør)
                      {currentUserId === booking.sender_id && ' (Deg)'}
                    </h4>
                    <div className="space-y-1 text-sm">
                      {senderProfile.contact_info.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{senderProfile.contact_info.phone}</span>
                        </div>
                      )}
                      {senderProfile.contact_info.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{senderProfile.contact_info.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {receiverProfile?.contact_info && (
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">
                      {receiverProfile.display_name} (Artist/Maker)
                      {currentUserId === booking.receiver_id && ' (Deg)'}
                    </h4>
                    <div className="space-y-1 text-sm">
                      {receiverProfile.contact_info.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{receiverProfile.contact_info.phone}</span>
                        </div>
                      )}
                      {receiverProfile.contact_info.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{receiverProfile.contact_info.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portefølje - alltid synlig for alle */}
          {maker && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Portefølje - {maker.display_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePortfolioViewer 
                  userId={maker.user_id} 
                  isOwnProfile={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Tekniske spesifikasjoner - kun for eiere */}
          {(isOwner || showSensitiveInfo) && booking.tech_spec && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tekniske spesifikasjoner
                  <Badge variant="outline" className="text-xs">Kun synlig for partene</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{booking.tech_spec}</pre>
              </CardContent>
            </Card>
          )}

          {/* Hospitality rider - kun for eiere */}
          {(isOwner || showSensitiveInfo) && booking.hospitality_rider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Hospitality Rider
                  <Badge variant="outline" className="text-xs">Kun synlig for partene</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{booking.hospitality_rider}</pre>
              </CardContent>
            </Card>
          )}

          {/* Publiseringsinformasjon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publiseringsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Status:</strong> Publisert arrangement</p>
                {booking.published_at && (
                  <p><strong>Publisert:</strong> {format(new Date(booking.published_at), 'dd. MMMM yyyy', { locale: nb })}</p>
                )}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Offentlig synlig informasjon:</h5>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Tittel og beskrivelse</li>
                    <li>• Dato, tid og spillested</li>
                    <li>• Billettpris og forventet publikum</li>
                    <li>• Artistens portefølje</li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">Privat informasjon (kun for partene):</h5>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• Musiker honorar og økonomiske detaljer</li>
                    <li>• Kontaktinformasjon</li>
                    <li>• Tekniske spesifikasjoner og hospitality rider</li>
                    <li>• Private meldinger og avtalehistorikk</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};