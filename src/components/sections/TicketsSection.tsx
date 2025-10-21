import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from 'lucide-react';
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
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mine billetter</h1>
          <p className="text-muted-foreground">Administrer dine kjøpte billetter</p>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Du har ikke kjøpt noen billetter ennå</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => {
              const eventName = ticket.events_market?.title || 'Ukjent arrangement';
              const eventVenue = ticket.events_market?.venue || 'Ikke spesifisert';
              const eventDate = ticket.events_market?.date 
                ? new Date(ticket.events_market.date).toLocaleDateString('nb-NO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Ikke spesifisert';
              const ticketPrice = ticket.events_market?.ticket_price 
                ? `${ticket.events_market.ticket_price} kr`
                : 'Gratis';

              return (
                <div key={ticket.id} className="border rounded-lg p-6 bg-card shadow-sm">
                  {/* Event Info Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{eventName}</h2>
                    <div className="space-y-1 text-muted-foreground">
                      <p className="text-sm">📍 {eventVenue}</p>
                      <p className="text-sm">📅 {eventDate}</p>
                      <p className="text-sm font-semibold text-foreground">💳 {ticketPrice}</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  {ticket.qr_code_data && (
                    <div className="flex flex-col items-center py-6 mb-6 bg-background rounded-lg border-2">
                      <p className="text-sm font-medium mb-4">Skann QR-koden ved inngang</p>
                      <div className="bg-white p-4 rounded-lg">
                        <QRCode 
                          value={ticket.qr_code_data} 
                          size={200}
                          level="H"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 font-mono">
                        {ticket.ticket_code}
                      </p>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {ticket.status === 'valid' ? '✅ Gyldig' : 
                         ticket.status === 'used' ? '✓ Brukt' : ticket.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Kjøpt</p>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
