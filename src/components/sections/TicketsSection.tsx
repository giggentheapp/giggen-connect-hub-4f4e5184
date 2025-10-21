import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Calendar, MapPin, Banknote } from 'lucide-react';
import { UserProfile } from "@/types/auth";
import QRCode from 'react-qr-code';

interface TicketsSectionProps {
  profile: UserProfile;
}

interface EventData {
  id: string;
  title: string;
  venue: string | null;
  date: string;
  ticket_price: number | null;
}

interface TicketData {
  id: string;
  user_id: string;
  event_id: string | null;
  stripe_payment_id: string | null;
  qr_code: string | null;
  qr_code_data: string;
  ticket_code: string;
  status: string;
  created_at: string;
  purchased_at: string;
  used_at: string | null;
  checked_in_by: string | null;
  events_market?: EventData;
}

export const TicketsSection = ({ profile }: TicketsSectionProps) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTickets([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events_market!tickets_event_id_fkey (
            id,
            title,
            venue,
            date,
            ticket_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      } else {
        setTickets(data as any || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-muted-foreground">Laster billetter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border shadow-sm">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">
            Mine billetter
          </h1>
          <p className="text-muted-foreground">Dine kjøpte billetter og QR-koder</p>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-6">
              <Ticket className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ingen billetter ennå</h3>
            <p className="text-muted-foreground">Kjøp billetter til arrangementer for å se dem her</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => {
              const eventName = ticket.events_market?.title || 'Ukjent arrangement';
              const eventVenue = ticket.events_market?.venue || 'Ikke spesifisert';
              const eventDate = ticket.events_market?.date 
                ? new Date(ticket.events_market.date).toLocaleDateString('nb-NO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Ikke spesifisert';
              const ticketPrice = ticket.events_market?.ticket_price 
                ? `${ticket.events_market.ticket_price} kr`
                : 'Gratis';

              const isValid = ticket.status === 'valid';
              const isUsed = ticket.status === 'used';

              return (
                <div 
                  key={ticket.id} 
                  className="bg-card rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Ticket Header with Event Info */}
                  <div className="bg-gradient-to-r from-primary/10 via-accent-blue/10 to-accent-purple/10 p-6 border-b-2 border-dashed border-border/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2 text-foreground">
                          {eventName}
                        </h2>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">{eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{eventVenue}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                        isValid ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                        isUsed ? 'bg-muted text-muted-foreground' :
                        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {isValid ? '✓ Gyldig' : isUsed ? '✓ Brukt' : ticket.status}
                      </div>
                    </div>

                    {/* Price Tag */}
                    <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border">
                      <Banknote className="h-4 w-4 text-primary" />
                      <span className="font-bold text-lg">{ticketPrice}</span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  {ticket.qr_code_data && (
                    <div className="p-8 bg-gradient-to-br from-background to-muted/20">
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wide">
                          Skann QR-koden ved inngang
                        </p>
                        
                        {/* QR Code Container */}
                        <div className="relative">
                          <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-primary/20">
                            <QRCode 
                              value={ticket.qr_code_data} 
                              size={240}
                              level="H"
                              className="rounded-lg"
                            />
                          </div>
                          
                          {/* Corner decorations */}
                          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                        </div>
                        
                        {/* Ticket Code */}
                        <div className="mt-6 text-center">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                            Billettkode
                          </p>
                          <p className="font-mono text-sm font-bold bg-muted/50 px-4 py-2 rounded-lg inline-block">
                            {ticket.ticket_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket Footer with Details */}
                  <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Kjøpt</p>
                      <p className="font-medium">
                        {new Date(ticket.purchased_at || ticket.created_at).toLocaleDateString('nb-NO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground mb-1">Billett-ID</p>
                      <p className="font-mono text-xs">{ticket.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
