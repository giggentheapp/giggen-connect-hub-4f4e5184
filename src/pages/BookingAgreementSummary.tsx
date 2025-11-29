import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, MapPin, Users, Info } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useBooking } from '@/hooks/useBooking';
import { useConcepts } from '@/hooks/useConcepts';
import { useProfile } from '@/hooks/useProfile';

const BookingAgreementSummary = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { user, loading: userLoading } = useCurrentUser();
  const { booking, loading: bookingLoading } = useBooking(bookingId);
  
  const senderId = booking?.sender_id;
  const receiverId = booking?.receiver_id;
  
  const { profile: senderProfile } = useProfile(senderId);
  const { profile: receiverProfile } = useProfile(receiverId);
  const { concepts } = useConcepts(receiverId);
  
  const selectedConcept = concepts.find(c => c.id === booking?.selected_concept_id);
  const currentUserId = user?.id || '';
  const loading = userLoading || bookingLoading;

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
          <p className="text-muted-foreground mb-4">Booking ikke funnet</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = booking.event_date ? format(new Date(booking.event_date), 'PPP') : 'Ikke spesifisert';
  const eventTime = booking.time || 'Ikke spesifisert';
  const numberOfParticipants = booking.number_of_participants || 'Ikke spesifisert';
  const location = booking.location || 'Ikke spesifisert';
  const additionalInformation = booking.additional_information || 'Ingen tilleggsinformasjon';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{booking.title}</h1>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Arrangementdetaljer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span><strong>Dato:</strong> {eventDate}</span>
              </div>
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2" />
                <span><strong>Tid:</strong> {eventTime}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 mr-2" />
                <span><strong>Antall deltakere:</strong> {numberOfParticipants}</span>
              </div>
              <div className="flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                <span><strong>Sted:</strong> {location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Konsept</h2>
           {selectedConcept ? (
              <div>
                <h3 className="font-semibold">{selectedConcept.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedConcept.description}</p>
                <ConceptPortfolioGallery conceptId={selectedConcept.id} />
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  Intet konsept er valgt for denne bookingen.
                </AlertDescription>
              </Alert>
            )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Tilleggsinformasjon</h2>
          <p>{additionalInformation}</p>
        </div>
      </main>
    </div>
  );
};

export default BookingAgreementSummary;
