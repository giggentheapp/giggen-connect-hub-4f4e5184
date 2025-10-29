import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Banknote, ArrowLeft, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { BookingPortfolioGallery } from '@/components/BookingPortfolioGallery';
import { usePurchaseTicket } from '@/hooks/useTickets';
import { TicketQRModal } from '@/components/TicketQRModal';

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
  has_paid_tickets?: boolean;
  public_visibility_settings?: Record<string, boolean>;
}

const PublicEventView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEventData | null>(null);
  const [makerProfile, setMakerProfile] = useState<any>(null);
  const [portfolioAttachments, setPortfolioAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPaidTickets, setHasPaidTickets] = useState(false);
  const [marketEventId, setMarketEventId] = useState<string | null>(null);
  const [userTicket, setUserTicket] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const purchaseTicket = usePurchaseTicket();

  useEffect(() => {
    if (id) {
      fetchPublicEventData();
    }
  }, [id]);

  useEffect(() => {
    // Check for user ticket after we know the marketEventId
    if (marketEventId || id) {
      checkUserTicket();
    }
  }, [marketEventId, id]);

  const checkUserTicket = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has a ticket for this event (using marketEventId if available)
      const eventIdToCheck = marketEventId || id;
      
      const { data: ticket } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventIdToCheck)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserTicket(ticket);
    } catch (error) {
      console.error('Error checking user ticket:', error);
    }
  };

  const fetchPublicEventData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, try to fetch from events_market (for public ticket events)
      const { data: marketEventData, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

      if (marketEventData) {
        // Convert events_market format to booking format for display
        setEvent({
          id: marketEventData.id,
          title: marketEventData.title,
          description: marketEventData.description,
          event_date: marketEventData.event_datetime || marketEventData.date,
          time: marketEventData.time ? marketEventData.time.toString() : null,
          venue: marketEventData.venue,
          address: null,
          ticket_price: marketEventData.ticket_price,
          audience_estimate: marketEventData.expected_audience,
          sender_id: marketEventData.created_by || '',
          receiver_id: marketEventData.created_by || '',
          selected_concept_id: null,
          is_public_after_approval: true,
        });

        setHasPaidTickets(marketEventData.has_paid_tickets || false);
        setMarketEventId(marketEventData.id); // Use this ID for ticket purchase

        // Fetch maker profile
        if (marketEventData.created_by) {
          const { data: profileData } = await supabase
            .rpc('get_public_profile', { target_user_id: marketEventData.created_by })
            .maybeSingle();
          
          setMakerProfile(profileData);
        }

        setLoading(false);
        return;
      }
      
      // If not in events_market, try bookings
      const { data: eventData, error: eventError } = await supabase
        .from('bookings')
        .select('id, title, description, event_date, time, venue, address, ticket_price, audience_estimate, sender_id, receiver_id, selected_concept_id, is_public_after_approval, public_visibility_settings')
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

      setEvent({
        ...eventData,
        public_visibility_settings: eventData.public_visibility_settings as Record<string, boolean> || {}
      });

      // Check if event has paid tickets in events_market
      const { data: marketEvent } = await supabase
        .from('events_market')
        .select('id, has_paid_tickets')
        .eq('title', eventData.title)
        .maybeSingle();
      
      setHasPaidTickets(marketEvent?.has_paid_tickets || false);
      if (marketEvent) {
        setMarketEventId(marketEvent.id); // Store market event ID for ticket purchase
      }

      // Fetch maker profile (receiver is usually the artist/maker)
      const { data: profileData } = await supabase
        .rpc('get_public_profile', { target_user_id: eventData.receiver_id })
        .maybeSingle();
      
      setMakerProfile(profileData);

      // Fetch portfolio attachments from booking_portfolio_attachments
      const { data: attachmentsData } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_type,
            file_url,
            mime_type,
            title,
            description
          )
        `)
        .eq('booking_id', id)
        .order('created_at', { ascending: false });
      
      setPortfolioAttachments(attachmentsData || []);

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
            <Button onClick={() => navigate('/dashboard?section=bookings&tab=upcoming')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get visibility settings from event, with defaults
  const visibilitySettings = event.public_visibility_settings || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard?section=bookings&tab=upcoming')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        {/* Event Header */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-bold flex-1">{event.title}</h1>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white whitespace-nowrap">
              Arrangement
            </Badge>
          </div>

          {makerProfile?.display_name && (
            <p className="text-xl text-muted-foreground">
              med {makerProfile.display_name}
            </p>
          )}
          
          {event.description && visibilitySettings.show_description !== false && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-4 py-6">
          {event.ticket_price && visibilitySettings.show_ticket_price !== false && (
            <div className="flex items-start gap-3">
              <Banknote className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Pris</p>
                <p className="text-muted-foreground">{event.ticket_price} kr</p>
              </div>
            </div>
          )}

          {event.event_date && visibilitySettings.show_date !== false && (
            <div className="flex items-start gap-3">
              <Calendar className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Dato{event.time && visibilitySettings.show_time !== false && ' og tid'}</p>
                <p className="text-muted-foreground">
                  {format(new Date(event.event_date), 'EEEE d. MMMM yyyy', { locale: nb })}
                  {event.time && visibilitySettings.show_time !== false && ` kl. ${event.time}`}
                </p>
              </div>
            </div>
          )}

          {(event.venue || event.address) && (visibilitySettings.show_venue !== false || visibilitySettings.show_address !== false) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Sted</p>
                {event.venue && visibilitySettings.show_venue !== false && <p className="text-muted-foreground">{event.venue}</p>}
                {event.address && visibilitySettings.show_address !== false && <p className="text-sm text-muted-foreground">{event.address}</p>}
              </div>
            </div>
          )}

          {event.audience_estimate && visibilitySettings.show_audience_estimate !== false && (
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-base mb-0.5">Forventet publikum</p>
                <p className="text-muted-foreground">{event.audience_estimate} personer</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Gallery */}
        {portfolioAttachments.length > 0 && visibilitySettings.show_portfolio !== false && (
          <div className="mt-8 space-y-4">
            <BookingPortfolioGallery portfolioAttachments={portfolioAttachments} />
          </div>
        )}

        {/* Ticket Purchase/Display Section */}
        <div className="mt-8 pt-8 border-t">
          {userTicket ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Din billett</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {userTicket.status === 'valid' ? 'Gyldig' : 
                     userTicket.status === 'used' ? 'Brukt' : userTicket.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Kjøpt</p>
                  <p className="text-sm">
                    {new Date(userTicket.purchased_at || userTicket.created_at).toLocaleDateString('nb-NO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => setShowQR(true)}
              >
                <Ticket className="h-5 w-5 mr-2" />
                Vis billett
              </Button>

              <TicketQRModal
                open={showQR}
                onOpenChange={setShowQR}
                ticket={userTicket}
                event={event}
              />
            </div>
          ) : hasPaidTickets && marketEventId ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Kjøp billett</h2>
              <p className="text-muted-foreground">
                Sikre din plass på arrangementet ved å kjøpe billett nå.
              </p>
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => purchaseTicket.mutate(marketEventId)}
                disabled={purchaseTicket.isPending}
              >
                <Ticket className="h-5 w-5 mr-2" />
                {purchaseTicket.isPending ? 'Åpner betalingsvindu...' : `Kjøp billett - ${event.ticket_price} kr`}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Billettsalg</h2>
              <p className="text-muted-foreground">
                Billetter til dette arrangementet er ikke tilgjengelig for kjøp i appen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicEventView;
