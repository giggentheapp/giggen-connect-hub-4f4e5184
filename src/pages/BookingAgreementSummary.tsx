import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, MapPin, Users, Info } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';

const BookingAgreementSummary = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setCurrentUserId(user.id);

        // Get booking data
        if (bookingId) {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (bookingError) throw bookingError;
          setBooking(bookingData);

          // Load selected concept if available
          if (bookingData.selected_concept_id) {
            const { data: conceptData } = await supabase
              .from('concepts')
              .select('*')
              .eq('id', bookingData.selected_concept_id)
              .single();
            
            if (conceptData) setSelectedConcept(conceptData);
          }

          // Load profiles
          const { data: senderData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', bookingData.sender_id)
            .single();
          
          const { data: receiverData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', bookingData.receiver_id)
            .single();

          if (senderData) setSenderProfile(senderData);
          if (receiverData) setReceiverProfile(receiverData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Feil',
          description: 'Kunne ikke laste avtaledetaljer',
          variant: 'destructive'
        });
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, navigate, toast]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch {
      return dateString;
    }
  };

  const handleBack = () => {
    // Navigate back to events list in explore page
    navigate('/', { state: { activeView: 'list' } });
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
          <p className="text-muted-foreground mb-4">Avtale ikke funnet</p>
          <Button onClick={() => navigate('/bookings')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
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
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Info Alert */}
        <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Slik vises arrangementet til publikum når det publiseres
          </AlertDescription>
        </Alert>

        {/* Event Hero Section */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            {receiverProfile?.avatar_url && (
              <img 
                src={receiverProfile.avatar_url} 
                alt={receiverProfile.display_name}
                className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{booking.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">
                med {receiverProfile?.display_name || 'Artist'}
              </p>
              {booking.description && (
                <p className="text-base leading-relaxed">{booking.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Event Information Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Date & Time */}
          {booking.event_date && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Dato og tid</span>
              </div>
              <p className="text-lg">
                {formatDate(booking.event_date)}
                {booking.time && ` kl. ${booking.time}`}
              </p>
            </div>
          )}

          {/* Location */}
          {(booking.venue || booking.address) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Sted</span>
              </div>
              {booking.venue && <p className="text-lg">{booking.venue}</p>}
              {booking.address && <p className="text-sm text-muted-foreground">{booking.address}</p>}
            </div>
          )}

          {/* Ticket Price */}
          {booking.ticket_price && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Billettpris</span>
              </div>
              <p className="text-lg font-medium">{booking.ticket_price} kr</p>
            </div>
          )}

          {/* Expected Audience */}
          {booking.audience_estimate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Kapasitet</span>
              </div>
              <p className="text-lg">{booking.audience_estimate} personer</p>
            </div>
          )}
        </div>

        {/* Portfolio Section */}
        {booking.selected_concept_id && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold mb-4">Portefølje</h3>
            <ConceptPortfolioGallery conceptId={booking.selected_concept_id} />
          </div>
        )}

        {/* Artist Info Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex items-center gap-4">
            {receiverProfile?.avatar_url && (
              <img 
                src={receiverProfile.avatar_url} 
                alt={receiverProfile.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Arrangør</p>
              <p className="text-lg font-medium">{senderProfile?.display_name || 'Arrangør'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingAgreementSummary;
