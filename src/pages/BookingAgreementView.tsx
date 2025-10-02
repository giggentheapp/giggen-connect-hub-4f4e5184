import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { BookingDocumentViewer } from '@/components/BookingDocumentViewer';
import { ArrowLeft, Calendar, MapPin, Banknote, Users, Music, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { getBookingNavigationTargetWithUser } from '@/lib/bookingNavigation';

const BookingAgreementView = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Get maker's data for portfolio, tech specs, and hospitality riders
  const makerId = booking?.receiver_id;
  const { concepts } = useUserConcepts(makerId);
  const { files: techSpecFiles } = useProfileTechSpecs(makerId);
  const { files: hospitalityFiles } = useHospitalityRiders(makerId);

  // Get selected concept details
  const selectedConcept = concepts.find(c => c.id === booking?.selected_concept_id);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke laste booking',
        variant: 'destructive'
      });
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (booking && currentUserId) {
      const target = getBookingNavigationTargetWithUser(booking, currentUserId);
      navigate(target);
    } else {
      navigate('/bookings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Booking ikke funnet</p>
          <Button onClick={() => navigate('/bookings')}>
            Tilbake til bookinger
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Bookingavtale
          </h1>
          <p className="text-muted-foreground">Fullstendig oversikt over avtalen</p>
        </div>

        <div className="space-y-6">
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

                {booking.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{booking.address}</span>
                  </div>
                )}

                {(selectedConcept?.expected_audience || booking.audience_estimate) && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Forventet publikum: {selectedConcept?.expected_audience || booking.audience_estimate}</span>
                  </div>
                )}
              </div>

              {(booking.price_musician || booking.price_ticket || booking.artist_fee || booking.door_deal) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Prising
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(booking.price_musician || booking.artist_fee || booking.door_deal) && (
                      <div>
                        <span className="text-sm text-muted-foreground">Musiker honorar:</span>
                        <p className="font-medium">
                          {booking.door_deal ? (
                            `${booking.door_percentage}% av dørinntekter`
                          ) : (
                            booking.artist_fee || booking.price_musician || 'Ikke spesifisert'
                          )}
                        </p>
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
                <CardTitle>Valgt tilbud</CardTitle>
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
                      <Banknote className="h-4 w-4" />
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
                <ProfilePortfolioViewer userId={makerId} isOwnProfile={false} />
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

          {/* Documents */}
          <BookingDocumentViewer
            techSpec={booking.tech_spec}
            hospitalityRider={booking.hospitality_rider}
            bookingStatus={booking.status}
            isVisible={true}
          />

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
      </main>
    </div>
  );
};

export default BookingAgreementView;
