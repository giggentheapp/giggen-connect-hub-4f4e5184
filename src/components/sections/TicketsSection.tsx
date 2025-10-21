import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Camera, MapPin, Calendar } from 'lucide-react';
import { UserProfile } from "@/types/auth";
import { QRScannerPanel } from './QRScannerPanel';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
  const [canScan, setCanScan] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
    checkAdminAccess();
    setupRealtimeSubscription();

    return () => {
      // Cleanup subscription on unmount
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('admin_whitelist')
        .select('can_scan_tickets')
        .eq('user_id', user.id)
        .maybeSingle();

      setCanScan(data?.can_scan_tickets || false);
    } catch (error) {
      console.error('Error checking admin access:', error);
    }
  };

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

  const setupRealtimeSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to changes in tickets table for this user
      const channel = supabase
        .channel('tickets-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'tickets',
            filter: `user_id=eq.${user.id}` // Only this user's tickets
          },
          (payload) => {
            console.log('Real-time update received:', payload);

            if (payload.eventType === 'UPDATE') {
              // Ticket was updated - update in local state
              setTickets(prevTickets =>
                prevTickets.map(ticket =>
                  ticket.id === payload.new.id 
                    ? { ...ticket, ...payload.new }
                    : ticket
                )
              );
            } else if (payload.eventType === 'INSERT') {
              // New ticket added - refetch to get full event data
              fetchTickets();
            } else if (payload.eventType === 'DELETE') {
              // Ticket deleted - remove from list
              setTickets(prevTickets =>
                prevTickets.filter(ticket => ticket.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription active for tickets');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error - real-time updates unavailable');
          }
        });

      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mine billetter</h1>
            <p className="text-muted-foreground">Administrer dine kjøpte billetter</p>
          </div>
          
          {/* Kamera-ikon for admins */}
          {canScan && (
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="p-3 rounded-lg hover:bg-accent transition-colors border"
              title="Skann billetter"
            >
              <Camera className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Scanner Modal */}
        {showScanner && canScan && (
          <QRScannerPanel 
            onClose={() => setShowScanner(false)}
          />
        )}

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
              <div key={ticket.id} className="border rounded-lg p-6 bg-card shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/arrangement/${ticket.events_market?.id}`)}>
                {/* Event Info Header */}
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">{eventName}</h2>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{eventVenue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{eventDate}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{ticketPrice}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {ticket.status === 'valid' ? 'Gyldig' : 
                       ticket.status === 'used' ? 'Brukt' : ticket.status}
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
