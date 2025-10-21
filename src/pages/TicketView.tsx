import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TicketData {
  id: string;
  qr_code_data: string;
  ticket_code: string;
  status: string;
  purchased_at: string;
  created_at: string;
  events_market?: {
    title: string;
    description: string | null;
    date: string;
    venue: string | null;
    ticket_price: number | null;
  };
}

const TicketView = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events_market!tickets_event_id_fkey (
            title,
            description,
            date,
            venue,
            ticket_price
          )
        `)
        .eq('id', ticketId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Ikke funnet",
          description: "Kunne ikke finne billetten",
          variant: "destructive"
        });
        navigate('/dashboard?section=tickets');
        return;
      }

      setTicket(data as any);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste billett",
        variant: "destructive"
      });
      navigate('/dashboard?section=tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketId) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Billett slettet",
        description: "Billetten har blitt permanent slettet"
      });

      navigate('/dashboard?section=tickets');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette billetten",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster billett...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Billett ikke funnet</p>
          <Button onClick={() => navigate('/dashboard?section=tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>
      </div>
    );
  }

  const eventName = ticket.events_market?.title || 'Ukjent arrangement';
  const eventDescription = ticket.events_market?.description;
  const eventVenue = ticket.events_market?.venue;
  const eventDate = ticket.events_market?.date
    ? format(new Date(ticket.events_market.date), 'EEEE d. MMMM yyyy', { locale: nb })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard?section=tickets')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til mine billetter
        </Button>

        <div className="space-y-8">
          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
              <QRCode 
                value={ticket.qr_code_data} 
                size={280}
                level="H"
              />
            </div>
            <p className="text-sm text-muted-foreground font-mono mb-2">
              {ticket.ticket_code}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20">
              <span className="text-sm font-medium">
                {ticket.status === 'valid' ? 'Gyldig billett' : 
                 ticket.status === 'used' ? 'Brukt' : ticket.status}
              </span>
            </div>
          </div>

          {/* Event Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">{eventName}</h1>
              {eventDescription && (
                <p className="text-muted-foreground leading-relaxed">
                  {eventDescription}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              {eventDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Dato</p>
                    <p className="text-muted-foreground">{eventDate}</p>
                  </div>
                </div>
              )}

              {eventVenue && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-accent-orange mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Sted</p>
                    <p className="text-muted-foreground">{eventVenue}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Kjøpt</p>
                    <p className="text-sm">
                      {new Date(ticket.purchased_at || ticket.created_at).toLocaleDateString('nb-NO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Ticket Button */}
          <div className="pt-6 border-t mt-8">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 w-full"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett billett
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Denne handlingen kan ikke angres. Billetten vil bli permanent slettet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteTicket}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Sletter...' : 'Slett permanent'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
