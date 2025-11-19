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
  has_paid_tickets?: boolean;
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

      // Fetch upcoming bookings where user is involved (sender, receiver, or event admin)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId},event_admin_id.eq.${userId}`)
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching upcoming bookings:', bookingsError);
        setError('Failed to fetch upcoming events');
        return;
      }

      // Fetch events from events_market created by user
      const { data: marketEvents, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'published')
        .order('date', { ascending: true });

      if (marketError) {
        console.error('Error fetching market events:', marketError);
      }

      // Transform bookings to upcoming events format
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
        is_sender: booking.sender_id === userId,
        is_receiver: booking.receiver_id === userId,
        is_public_after_approval: booking.is_public_after_approval,
        has_paid_tickets: false
      }));

      // Transform market events to upcoming events format
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
        status: 'upcoming',
        created_at: event.created_at,
        is_sender: false,
        is_receiver: false,
        is_public_after_approval: event.is_public,
        has_paid_tickets: event.has_paid_tickets || false
      }));

      // Combine and sort by date
      const allEvents = [...bookingEvents, ...transformedMarketEvents].sort((a, b) => {
        const dateA = new Date(a.event_date || a.created_at);
        const dateB = new Date(b.event_date || b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      setEvents(allEvents);
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