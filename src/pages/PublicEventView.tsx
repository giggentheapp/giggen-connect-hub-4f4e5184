import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Banknote, Music, ArrowLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface PublicEventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  ticket_price: number | null;
  audience_estimate: number | null;
  sender_id: string;
  receiver_id: string;
  selected_concept_id: string | null;
  is_public_after_approval: boolean | null;
}

const PublicEventView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEventData | null>(null);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPublicEventData();
    }
  }, [id]);

  const fetchPublicEventData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch event data - allow access if user is a party OR if event is public
      const { data: eventData, error: eventError } = await supabase
        .from('bookings')
        .select('id, title, description, event_date, time, venue, address, ticket_price, audience_estimate, sender_id, receiver_id, selected_concept_id, is_public_after_approval')
        .eq('id', id)
        .eq('status', 'upcoming')
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData) {
        toast({
          title: "Ikke funnet",
          description: "Dette arrangementet eksisterer ikke",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      // Check if user has access (is a party OR event is public)
      const isParty = user && (eventData.sender_id === user.id || eventData.receiver_id === user.id);
      const isPublic = eventData.is_public_after_approval;

      if (!isParty && !isPublic) {
        toast({
          title: "Ikke tilgang",
          description: "Dette arrangementet er ikke offentlig tilgjengelig",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setEvent(eventData);

      // Fetch maker profile (receiver is usually the artist/maker)
      const { data: profileData } = await supabase
        .rpc('get_public_profile', { target_user_id: eventData.receiver_id })
        .maybeSingle();
      
      setMakerProfile(profileData);

    } catch (error: any) {
      console.error('Error fetching public event:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste arrangementdetaljer",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Laster arrangement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Arrangement ikke funnet</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til utforsk
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til utforsk
        </Button>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold">{event.title}</h1>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white">
              Offentlig arrangement
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-lg text-muted-foreground mt-4">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent-orange" />
              Arrangementsinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.event_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Dato</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                    </p>
                  </div>
                </div>
              )}

              {event.time && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Tid</p>
                    <p className="text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              )}

              {event.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Spillested</p>
                    <p className="text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}

              {event.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-muted-foreground">{event.address}</p>
                  </div>
                </div>
              )}

              {event.audience_estimate && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Forventet publikum</p>
                    <p className="text-muted-foreground">{event.audience_estimate} personer</p>
                  </div>
                </div>
              )}

              {event.ticket_price && (
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-accent-orange mt-1" />
                  <div>
                    <p className="font-medium">Billettpris</p>
                    <p className="text-muted-foreground">{event.ticket_price} kr</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Portfolio */}
        {event.selected_concept_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-accent-orange" />
                Portefølje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConceptPortfolioGallery conceptId={event.selected_concept_id} />
            </CardContent>
          </Card>
        )}

        {/* Info box about privacy */}
        <Card className="mt-6 border-accent-orange/20 bg-accent-orange/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Dette er en offentlig visning. Økonomiske detaljer, kontaktinformasjon og tekniske spesifikasjoner er kun tilgjengelig for partene involvert i arrangementet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicEventView;
