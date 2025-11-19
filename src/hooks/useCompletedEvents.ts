import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompletedEvent {
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
  completed_at?: string;
  // For identifying user role in the event
  is_sender: boolean;
  is_receiver: boolean;
  is_public_after_approval?: boolean;
  has_paid_tickets?: boolean;
}

export const useCompletedEvents = (userId: string) => {
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedEvents = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch completed bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId},event_admin_id.eq.${userId}`)
        .eq('status', 'completed')
        .order('event_date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching completed bookings:', bookingsError);
        setError('Failed to fetch completed events');
        return;
      }

      // Fetch completed events from events_market created by user
      const { data: marketEvents, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (marketError) {
        console.error('Error fetching completed market events:', marketError);
      }

      // Transform bookings to completed events format
      const bookingEvents = (bookings || []).map((booking) => ({
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
        completed_at: booking.updated_at,
        is_sender: booking.sender_id === userId,
        is_receiver: booking.receiver_id === userId,
        is_public_after_approval: booking.is_public_after_approval,
        has_paid_tickets: false
      }));

      // Transform market events to completed events format
      const transformedMarketEvents = (marketEvents || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.date,
        time: event.time || event.start_time,
        venue: event.venue,
        address: event.address,
        ticket_price: event.ticket_price,
        audience_estimate: event.expected_audience,
        status: 'completed',
        created_at: event.created_at,
        is_sender: false,
        is_receiver: false,
        is_public_after_approval: event.is_public,
        has_paid_tickets: event.has_paid_tickets || false
      }));

      // Combine and sort by event date (most recent first)
      const allEvents = [...bookingEvents, ...transformedMarketEvents].sort((a, b) => {
        const dateA = new Date(a.event_date || a.created_at);
        const dateB = new Date(b.event_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Error in fetchCompletedEvents:', err);
      setError('Failed to fetch completed events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedEvents();
  }, [userId]);

  return {
    events,
    loading,
    error,
    refetch: fetchCompletedEvents
  };
};
