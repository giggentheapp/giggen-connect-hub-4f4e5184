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

export const usePublicEvents = (makerId: string) => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎭 Fetching public events for maker:', makerId);

      // Fetch published events for this maker using the public access policy
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id, title, description, event_date, time, venue, 
          ticket_price, audience_estimate, sender_id, receiver_id,
          status, created_at, published_at
        `)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true)
        .eq('both_parties_approved', true)
        .or(`sender_id.eq.${makerId},receiver_id.eq.${makerId}`)
        .order('event_date', { ascending: true, nullsFirst: false });

      if (fetchError) {
        console.error('❌ Error fetching public events:', fetchError);
        throw fetchError;
      }

      console.log('✅ Fetched public events:', data?.length || 0);
      setEvents(data || []);

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