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
}

export const useAllPublicEvents = () => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPublicEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎭 Fetching all public events for Goer view...');

      // Fetch all published events that Goers can see
      // This uses the "goers_can_view_published_events" RLS policy
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id, title, description, event_date, time, venue, 
          ticket_price, audience_estimate, sender_id, receiver_id,
          status, created_at, published_at
        `)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true)
        .order('event_date', { ascending: true, nullsFirst: false });

      if (fetchError) {
        console.error('❌ Error fetching all public events:', fetchError);
        throw fetchError;
      }

      console.log('✅ Fetched all public events:', data?.length || 0);
      setEvents(data || []);

    } catch (err: any) {
      console.error('❌ Error in fetchAllPublicEvents:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPublicEvents();
  }, [fetchAllPublicEvents]);

  return { events, loading, error, refetch: fetchAllPublicEvents };
};