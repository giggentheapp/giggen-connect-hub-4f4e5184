import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useConcepts } from '@/hooks/useConcepts';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useBooking } from '@/hooks/useBooking';
import { BookingPortfolioAttachments } from '@/components/BookingPortfolioAttachments';
import { BookingPublishPreviewModal } from '@/components/BookingPublishPreviewModal';
import { ArrowLeft, Calendar, MapPin, Banknote, Users, FileText, Music2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getBookingNavigationTargetWithUser } from '@/lib/bookingNavigation';

const BookingAgreementView = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [showPublishPreview, setShowPublishPreview] = useState(false);

  const { user, loading: userLoading } = useCurrentUser();
  const { booking, loading: bookingLoading } = useBooking(bookingId);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, userLoading, navigate]);
  
  const currentUserId = user?.id || '';
  const makerId = booking?.receiver_id;
  
  const { concepts } = useConcepts(makerId);
  const { files: techSpecFiles } = useProfileTechSpecs(makerId);
  const { files: hospitalityFiles } = useHospitalityRiders(makerId);

  const selectedConcept = concepts.find(c => c.id === booking?.selected_concept_id);
  const isBothApproved = booking?.status === 'approved_by_both' || booking?.status === 'upcoming';
  const loading = userLoading || bookingLoading;

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          
          {isBothApproved && booking?.status === 'approved_by_both' && (
            <Button 
              onClick={() => setShowPublishPreview(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Forhåndsvis og publiser
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Title Section */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{booking.title}</h1>
          {booking.description && (
            <p className="text-lg text-muted-foreground">{booking.description}</p>
          )}
        </div>

        {/* Event Details */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-accent-orange" />
            Detaljer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
            {booking.event_date && (
              <div>
                <p className="text-sm text-muted-foreground">Dato og tid</p>
                <p className="font-medium">{format(new Date(booking.event_date), 'EEEE d. MMMM yyyy', { locale: nb })} kl. {booking.time || format(new Date(booking.event_date), 'HH:mm')}</p>
              </div>
            )}
            
            {booking.venue && (
              <div>
                <p className="text-sm text-muted-foreground">Spillested</p>
                <p className="font-medium">{booking.venue}</p>
              </div>
            )}

            {booking.address && (
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{booking.address}</p>
              </div>
            )}

            {(selectedConcept?.expected_audience || booking.audience_estimate) && (
              <div>
                <p className="text-sm text-muted-foreground">Forventet publikum</p>
                <p className="font-medium">{selectedConcept?.expected_audience || booking.audience_estimate} personer</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Banknote className="h-6 w-6 text-accent-orange" />
            Økonomi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
            {booking.by_agreement ? (
              <div>
                <p className="text-sm text-muted-foreground">Musiker honorar</p>
                <p className="font-medium">Etter avtale</p>
              </div>
            ) : booking.door_deal ? (
              <div>
                <p className="text-sm text-muted-foreground">Musiker honorar</p>
                <p className="font-medium">{booking.door_percentage}% av dørinntekter</p>
              </div>
            ) : (
              <>
                {(booking.artist_fee || booking.price_musician) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Musiker honorar</p>
                    <p className="font-medium">{booking.artist_fee ? `${booking.artist_fee} kr` : booking.price_musician}</p>
                  </div>
                )}
              </>
            )}

            {booking.ticket_price && (
              <div>
                <p className="text-sm text-muted-foreground">Billettpris</p>
                <p className="font-medium">{booking.ticket_price} kr</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Concept */}
        {selectedConcept && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Music2 className="h-6 w-6 text-accent-orange" />
              Valgt tilbud
            </h2>
            <div className="pl-8">
              <h3 className="font-medium text-lg">{selectedConcept.title}</h3>
              {selectedConcept.description && (
                <p className="text-muted-foreground mt-1">{selectedConcept.description}</p>
              )}
              {selectedConcept.price && (
                <p className="mt-2">Pris: {selectedConcept.price} kr</p>
              )}
            </div>
          </div>
        )}

        {/* Portfolio - Show only booking attachments */}
        {bookingId && currentUserId && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Portefølje</h2>
            <div className="pl-8">
              <BookingPortfolioAttachments
                bookingId={bookingId}
                currentUserId={currentUserId}
                canEdit={booking?.status === 'allowed' || booking?.status === 'approved_by_sender' || booking?.status === 'approved_by_receiver'}
              />
            </div>
          </div>
        )}

        {/* Tech Specs */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent-orange" />
            Tekniske spesifikasjoner
          </h2>
          <div className="pl-8">
            {techSpecFiles.length > 0 ? (
              <div className="space-y-2">
                {techSpecFiles.map((file) => (
                  <a 
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary hover:underline"
                  >
                    {file.filename}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Ikke lagt ved</p>
            )}
          </div>
        </div>

        {/* Hospitality Rider */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Hospitality Rider</h2>
          <div className="pl-8">
            {hospitalityFiles.length > 0 ? (
              <div className="space-y-2">
                {hospitalityFiles.map((file) => (
                  <a 
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary hover:underline"
                  >
                    {file.filename}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Ikke lagt ved</p>
            )}
          </div>
        </div>

        {/* Legal Notice */}
        <div className="pt-8 border-t text-sm text-muted-foreground space-y-2">
          <p>Begge parter er forpliktet til å overholde avtalens vilkår.</p>
          <p>Ved publisering blir tittel, beskrivelse, dato, sted og billettpris synlig for allmennheten. Musiker honorar, tech spec og hospitality rider forblir privat.</p>
        </div>
      </main>
      
      {/* Publish Preview Modal */}
      {bookingId && currentUserId && isBothApproved && (
        <BookingPublishPreviewModal
          bookingId={bookingId}
          isOpen={showPublishPreview}
          onClose={() => setShowPublishPreview(false)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default BookingAgreementView;
