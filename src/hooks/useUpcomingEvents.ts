import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UpcomingEvent {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  time?: string;
  venue?: string;
  address?: string;
  ticket_price?: number;
  audience_estimate?: number;
  status: string;
  created_at: string;
  // For identifying user role in the event
  is_sender: boolean;
  is_receiver: boolean;
  is_public_after_approval?: boolean;
}

export const useUpcomingEvents = (userId: string) => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingEvents = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch upcoming bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching upcoming bookings:', bookingsError);
        setError('Failed to fetch upcoming events');
        return;
      }

      // Transform bookings to upcoming events format
      const upcomingEvents: UpcomingEvent[] = (bookings || []).map(booking => ({
        id: booking.id,
        title: booking.title,
        description: booking.description,
        event_date: booking.event_date,
        time: booking.time,
        venue: booking.venue,
        address: booking.address,
        ticket_price: booking.ticket_price,
        audience_estimate: booking.audience_estimate,
        status: booking.status,
        created_at: booking.created_at,
        is_sender: booking.sender_id === userId,
        is_receiver: booking.receiver_id === userId,
        is_public_after_approval: booking.is_public_after_approval
      }));

      setEvents(upcomingEvents);
    } catch (err) {
      console.error('Error in fetchUpcomingEvents:', err);
      setError('Failed to fetch upcoming events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, [userId]);

  return {
    events,
    loading,
    error,
    refetch: fetchUpcomingEvents
  };
};