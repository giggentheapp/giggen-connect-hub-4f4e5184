import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Banknote, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const BookingPublishPreview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

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

  const handlePublish = async () => {
    try {
      setPublishing(true);

      const { error } = await supabase
        .from('bookings')
        .update({
          is_public_after_approval: true,
          published_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: '✅ Arrangement publisert!',
        description: 'Arrangementet er nå synlig for publikum'
      });

      navigate(`/arrangement/${bookingId}`);
    } catch (error: any) {
      console.error('Error publishing:', error);
      toast({
        title: 'Kunne ikke publisere',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setPublishing(false);
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
        <p>Booking ikke funnet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/bookings/${bookingId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til avtale
            </Button>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white">
              Forhåndsvisning
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{booking.title}</h1>
          <p className="text-lg text-muted-foreground">
            Forhåndsvisning av hvordan arrangementet vil se ut for publikum
          </p>
        </div>

        {/* Description */}
        {booking.description && (
          <div className="mb-8">
            <p className="text-lg leading-relaxed">{booking.description}</p>
          </div>
        )}

        {/* Event Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-accent-orange" />
            Arrangementsinformasjon
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border">
            {booking.event_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-accent-orange mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Dato</p>
                  <p className="text-muted-foreground">
                    {format(new Date(booking.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                    {booking.time && ` kl. ${booking.time}`}
                  </p>
                </div>
              </div>
            )}

            {booking.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent-orange mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Spillested</p>
                  <p className="text-muted-foreground">{booking.venue}</p>
                </div>
              </div>
            )}

            {booking.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent-orange mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-muted-foreground">{booking.address}</p>
                </div>
              </div>
            )}

            {booking.audience_estimate && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-accent-orange mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Forventet publikum</p>
                  <p className="text-muted-foreground">{booking.audience_estimate} personer</p>
                </div>
              </div>
            )}

            {booking.ticket_price && (
              <div className="flex items-start gap-3">
                <Banknote className="h-5 w-5 text-accent-orange mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Billettpris</p>
                  <p className="text-muted-foreground">{booking.ticket_price} kr</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio */}
        {booking.selected_concept_id && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Portefølje</h2>
            <ConceptPortfolioGallery conceptId={booking.selected_concept_id} />
          </div>
        )}

        {/* Info box */}
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                Dette er hvordan arrangementet vil se ut for publikum
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Økonomiske detaljer, kontaktinformasjon og tekniske spesifikasjoner vil forbli privat mellom dere som parter.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center pb-8">
          <Button
            size="lg"
            onClick={handlePublish}
            disabled={publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            {publishing ? 'Publiserer...' : 'Publiser arrangement'}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`/bookings/${bookingId}`)}
          >
            Avbryt
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BookingPublishPreview;
