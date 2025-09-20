import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, AlertTriangle, Calendar, MapPin, Banknote, Users, Eye, Settings, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface BookingApprovalDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BookingApprovalDialog = ({ booking: initialBooking, isOpen, onClose, currentUserId }: BookingApprovalDialogProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [privacySettings, setPrivacySettings] = useState<any>({});
  const [publicFieldSettings, setPublicFieldSettings] = useState({
    title: true,
    description: true,
    event_date: true,
    time: true,
    venue: true,
    ticket_price: true,
    audience_estimate: true
  });
  const [hasReadSummary, setHasReadSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [fetchingFreshData, setFetchingFreshData] = useState(false);

  const { updateBooking } = useBookings();
  const { toast } = useToast();

  const isSender = currentUserId === booking?.sender_id;
  const isReceiver = currentUserId === booking?.receiver_id;
  const userConfirmedField = isSender ? 'approved_by_sender' : 'approved_by_receiver';
  const otherUserConfirmedField = isSender ? 'approved_by_receiver' : 'approved_by_sender';

  // Load user profile, privacy settings, and fresh booking data
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const loadAllData = async () => {
      try {
        // Fetch fresh booking data first
        if (initialBooking?.id) {
          setFetchingFreshData(true);
          console.log('🔄 BookingApprovalDialog: Fetching fresh booking data...');
          
          const { data: freshBooking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', initialBooking.id)
            .single();
            
          if (bookingError) throw bookingError;
          
          console.log('✅ Fresh booking data loaded:', {
            id: freshBooking.id,
            last_modified_at: freshBooking.last_modified_at,
            event_date: freshBooking.event_date,
            time: freshBooking.time
          });
          
          setBooking(freshBooking);
          setFetchingFreshData(false);
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUserId)
          .single();

        setUserProfile(profile);

        // Get privacy settings if user is a maker
        if (profile?.role === 'maker') {
          const { data: settings } = await supabase
            .from('profile_settings')
            .select('*')
            .eq('maker_id', currentUserId)
            .single();

          setPrivacySettings(settings || {});
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (initialBooking) {
          setBooking(initialBooking); // Fallback to initial booking
        }
        setFetchingFreshData(false);
      }
    };

    loadAllData();
  }, [isOpen, currentUserId, initialBooking?.id]);

  const handleApproval = async () => {
    if (!hasReadSummary) {
      toast({
        title: "Les sammendrag først",
        description: "Du må lese hele sammendraget før du kan godkjenne",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update booking with approval and privacy settings
      await updateBooking(booking.id, {
        [userConfirmedField]: true,
        is_public_after_approval: Object.values(publicFieldSettings).some(v => v),
        public_visibility_settings: publicFieldSettings,
        agreement_summary_text: generateAgreementSummary()
      });

      toast({
        title: "Booking godkjent! ✅",
        description: "Du har godkjent bookingen med dine personverninnstillinger",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Feil ved godkjenning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAgreementSummary = () => {
    const publicFields = Object.entries(publicFieldSettings)
      .filter(([_, isPublic]) => isPublic)
      .map(([field, _]) => field);

    return `
Booking godkjent med følgende offentlige informasjon:
${publicFields.map(field => `- ${getFieldDisplayName(field)}`).join('\n')}

Privat informasjon (kun synlig for partene):
- Musiker honorar
- Kontaktinformasjon  
- Personlige meldinger
- Tekniske spesifikasjoner
- Hospitality rider
    `.trim();
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      title: 'Tittel',
      description: 'Beskrivelse',
      event_date: 'Dato',
      time: 'Klokkeslett',
      venue: 'Spillested',
      ticket_price: 'Billettpris',
      audience_estimate: 'Forventet publikum'
    };
    return fieldNames[field] || field;
  };

  if (!booking) return null;

  const bothConfirmed = booking.approved_by_sender && booking.approved_by_receiver;
  const userAlreadyConfirmed = booking[userConfirmedField];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>Godkjenn booking - {booking.title}</span>
            {fetchingFreshData && (
              <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground ml-auto">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Oppdaterer...</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Godkjenningsstatus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {booking.approved_by_sender ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Avsender godkjent for publisering</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {booking.approved_by_receiver ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span>Mottaker godkjent for publisering</span>
                </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Arrangementssammendrag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prominent Date/Time Section */}
                {(booking.event_date || booking.time) && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Dato og tid for arrangementet
                    </h4>
                    <div className="text-2xl font-bold text-primary">
                      {booking.event_date && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span>
                            {format(new Date(booking.event_date), 'EEEE dd. MMMM yyyy', { locale: nb })}
                          </span>
                          {booking.time && (
                            <>
                              <Clock className="h-5 w-5 mx-2 hidden sm:block" />
                              <span>kl. {booking.time}</span>
                            </>
                          )}
                        </div>
                      )}
                      {!booking.event_date && booking.time && (
                        <span>Kl. {booking.time}</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-2">{booking.title}</h3>
                  {booking.description && (
                    <p className="text-muted-foreground mb-4">{booking.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{booking.venue}</span>
                    </div>
                  )}

                  {booking.audience_estimate && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Forventet publikum: {booking.audience_estimate}</span>
                    </div>
                  )}

                  {booking.ticket_price && (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span>Billettpris: {booking.ticket_price} kr</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Hva skal være offentlig etter publisering?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Velg hvilken informasjon som skal være synlig for allmennheten når arrangementet publiseres.
                    Sensitiv informasjon som honorar og kontaktdetaljer forblir alltid privat.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(publicFieldSettings).map(([field, isPublic]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={isPublic}
                        onCheckedChange={(checked) => 
                          setPublicFieldSettings(prev => ({ ...prev, [field]: checked === true }))
                        }
                      />
                      <label 
                        htmlFor={field} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {getFieldDisplayName(field)}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded">
                  <h4 className="font-medium text-sm mb-2">Alltid privat:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Musiker honorar og økonomiske detaljer</li>
                    <li>• Kontaktinformasjon</li>
                    <li>• Personlige meldinger</li>
                    <li>• Tekniske spesifikasjoner</li>
                    <li>• Hospitality rider</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Vilkår og betingelser</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>Ved å godkjenne denne bookingen samtykker du til følgende:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Du forplikter deg til å overholde alle avtalevilkår</li>
                    <li>• Kontaktinformasjon deles kun mellom partene etter godkjenning</li>
                    <li>• Offentlig informasjon vil være synlig for alle brukere</li>
                    <li>• Endringer etter godkjenning krever samtykke fra begge parter</li>
                    <li>• Ved kansellering gjelder standard vilkår</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {!userAlreadyConfirmed && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="read-summary"
                  checked={hasReadSummary}
                  onCheckedChange={(checked) => setHasReadSummary(checked === true)}
                />
                <label htmlFor="read-summary" className="text-sm font-medium">
                  Jeg har lest og forstått alt over
                </label>
              </div>
              
              <Button 
                onClick={handleApproval}
                disabled={!hasReadSummary || loading}
                className="ml-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                {loading ? 'Godkjenner...' : 'Godkjenn booking'}
              </Button>
            </>
          )}

          {userAlreadyConfirmed && !bothConfirmed && (
            <Badge variant="outline" className="ml-auto">
              Du har godkjent - venter på den andre parten
            </Badge>
          )}

          {bothConfirmed && (
            <Badge variant="default" className="ml-auto bg-green-600">
              Begge parter har godkjent!
            </Badge>
          )}
          
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};