import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  time: string | null;
  venue: string | null;
  ticket_price: number | null;
  audience_estimate: number | null;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  published_at: string | null;
  has_paid_tickets?: boolean;
}

export const usePublicEvents = (makerId: string) => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎭 Fetching public events for maker:', makerId);

      // Fetch published events for this maker using the enhanced public access policy  
      // This will use the new "goers_can_view_published_events" policy for Goers
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id, title, description, event_date, time, venue, 
          ticket_price, audience_estimate, sender_id, receiver_id,
          status, created_at, published_at
        `)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true)
        .or(`sender_id.eq.${makerId},receiver_id.eq.${makerId}`)
        .order('event_date', { ascending: true, nullsFirst: false });

      if (fetchError) {
        console.error('❌ Error fetching public events:', fetchError);
        throw fetchError;
      }

      // For each booking, check if corresponding event in events_market has has_paid_tickets = true
      const eventsWithTicketStatus = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: marketEvent } = await supabase
            .from('events_market')
            .select('has_paid_tickets')
            .eq('title', booking.title)
            .eq('date', booking.event_date?.split('T')[0])
            .maybeSingle();
          
          return {
            ...booking,
            has_paid_tickets: marketEvent?.has_paid_tickets || false
          };
        })
      );

      console.log('✅ Fetched public events:', eventsWithTicketStatus?.length || 0);
      setEvents(eventsWithTicketStatus || []);

    } catch (err: any) {
      console.error('❌ Error in fetchPublicEvents:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [makerId]);

  useEffect(() => {
    if (makerId) {
      fetchPublicEvents();
    }
  }, [makerId, fetchPublicEvents]);

  return { events, loading, error, refetch: fetchPublicEvents };
};