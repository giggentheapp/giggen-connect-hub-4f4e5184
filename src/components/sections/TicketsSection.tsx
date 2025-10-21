import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from 'lucide-react';
import { UserProfile } from "@/types/auth";

interface TicketsSectionProps {
  profile: UserProfile;
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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      } else {
        setTickets((data as TicketData[]) || []);
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
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-6 bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Billettkode</p>
                    <p className="font-mono text-lg font-bold">{ticket.ticket_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{ticket.status === 'valid' ? 'Gyldig' : ticket.status}</p>
                  </div>
                </div>
                
                {ticket.qr_code_data && (
                  <div className="flex justify-center py-4">
                    <div className="border-2 border-dashed rounded p-4 bg-background">
                      <p className="text-xs text-center text-muted-foreground mb-2">QR-kode</p>
                      <p className="font-mono text-sm text-center break-all max-w-xs">{ticket.qr_code_data}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Kjøpt: {new Date(ticket.purchased_at || ticket.created_at).toLocaleDateString('nb-NO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billett-ID: {ticket.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
