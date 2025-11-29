import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database } from "@/integrations/supabase/types";

type EventMarketRow = Database['public']['Tables']['events_market']['Row'];
type EventMarketInsert = Database['public']['Tables']['events_market']['Insert'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  ticket_price: number | null;
  expected_audience: number | null;
  has_paid_tickets: boolean | null;
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  banner_url: string | null;
  participants: any;
}

export interface UpcomingEvent {
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
  is_sender: boolean;
  is_receiver: boolean;
  is_public_after_approval?: boolean;
  has_paid_tickets?: boolean;
  source: 'booking' | 'market';
}

export interface CreateEventInput {
  created_by: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  address?: string;
  ticket_price?: number;
  expected_audience?: number;
  has_paid_tickets?: boolean;
  is_public?: boolean;
  banner_url?: string;
  participants?: any;
  status?: string;
}

export const eventService = {
  /**
   * Get all public events from events_market
   */
  async getPublicEvents(): Promise<PublicEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events_market')
        .select('*')
        .eq('is_public', true)
        .order('date', { ascending: true });

      if (error) {
        logger.error('Failed to fetch public events', { error });
        throw error;
      }

      logger.business('Fetched public events', { count: data?.length || 0 });

      return (data || []) as PublicEvent[];
    } catch (error) {
      logger.error('Error in getPublicEvents', { error });
      return [];
    }
  },

  /**
   * Get upcoming events for a user (from both bookings and events_market)
   */
  async getUpcomingEvents(userId: string): Promise<UpcomingEvent[]> {
    try {
      // Fetch upcoming bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId},event_admin_id.eq.${userId}`)
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true });

      if (bookingsError) {
        logger.error('Failed to fetch upcoming bookings', { userId, error: bookingsError });
        throw bookingsError;
      }

      // Fetch events from events_market created by user
      const { data: marketEvents, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'published')
        .order('date', { ascending: true });

      if (marketError) {
        logger.error('Failed to fetch market events', { userId, error: marketError });
      }

      // Transform bookings to upcoming events format
      const bookingEvents: UpcomingEvent[] = (bookings || []).map((booking) => ({
        id: booking.id,
        title: booking.title,
        description: booking.description || undefined,
        event_date: booking.event_date || undefined,
        time: booking.time || undefined,
        venue: booking.venue || undefined,
        address: booking.address || undefined,
        ticket_price: booking.ticket_price || undefined,
        audience_estimate: booking.audience_estimate || undefined,
        status: booking.status,
        created_at: booking.created_at || new Date().toISOString(),
        is_sender: booking.sender_id === userId,
        is_receiver: booking.receiver_id === userId,
        is_public_after_approval: booking.is_public_after_approval || false,
        has_paid_tickets: false,
        source: 'booking' as const,
      }));

      // Transform market events to upcoming events format
      const transformedMarketEvents: UpcomingEvent[] = (marketEvents || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        event_date: event.date,
        time: event.time || event.start_time || undefined,
        venue: event.venue || undefined,
        address: event.address || undefined,
        ticket_price: event.ticket_price || undefined,
        audience_estimate: event.expected_audience || undefined,
        status: 'upcoming',
        created_at: event.created_at || new Date().toISOString(),
        is_sender: false,
        is_receiver: false,
        is_public_after_approval: event.is_public || false,
        has_paid_tickets: event.has_paid_tickets || false,
        source: 'market' as const,
      }));

      // Combine and sort by date
      const allEvents = [...bookingEvents, ...transformedMarketEvents].sort((a, b) => {
        const dateA = new Date(a.event_date || a.created_at);
        const dateB = new Date(b.event_date || b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      logger.business('Fetched upcoming events', {
        userId,
        bookingCount: bookingEvents.length,
        marketCount: transformedMarketEvents.length,
        total: allEvents.length,
      });

      return allEvents;
    } catch (error) {
      logger.error('Error in getUpcomingEvents', { userId, error });
      return [];
    }
  },

  /**
   * Get a single event by ID (searches both bookings and events_market)
   */
  async getEventById(eventId: string): Promise<EventMarketRow | BookingRow | null> {
    try {
      // Try to fetch from events_market first
      const { data: marketEvent, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (!marketError && marketEvent) {
        logger.business('Fetched event from events_market', { eventId });
        return marketEvent;
      }

      // If not found in events_market, try bookings
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (bookingError) {
        if (bookingError.code === 'PGRST116') {
          // No rows returned - not an error, just return null
          return null;
        }
        logger.error('Failed to fetch event', { eventId, error: bookingError });
        throw bookingError;
      }

      if (booking) {
        logger.business('Fetched event from bookings', { eventId });
      }

      return booking;
    } catch (error) {
      logger.error('Error in getEventById', { eventId, error });
      throw error;
    }
  },

  /**
   * Create a new event in events_market
   */
  async createEvent(eventData: CreateEventInput): Promise<EventMarketRow> {
    try {
      logger.business('Creating new event', {
        created_by: eventData.created_by,
        title: eventData.title,
        date: eventData.date,
      });

      const { data, error } = await supabase
        .from('events_market')
        .insert({
          created_by: eventData.created_by,
          title: eventData.title,
          description: eventData.description || null,
          date: eventData.date,
          time: eventData.time || null,
          start_time: eventData.start_time || null,
          end_time: eventData.end_time || null,
          venue: eventData.venue || null,
          address: eventData.address || null,
          ticket_price: eventData.ticket_price || null,
          expected_audience: eventData.expected_audience || null,
          has_paid_tickets: eventData.has_paid_tickets || false,
          is_public: eventData.is_public !== undefined ? eventData.is_public : false,
          banner_url: eventData.banner_url || null,
          participants: eventData.participants || { bands: [], musicians: [], organizers: [] },
          status: eventData.status || 'published',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create event', { eventData, error });
        throw error;
      }

      logger.business('Event created successfully', { eventId: data.id });

      return data;
    } catch (error) {
      logger.error('Error in createEvent', { eventData, error });
      throw error;
    }
  },

  /**
   * Get completed events for a user
   */
  async getCompletedEvents(userId: string): Promise<UpcomingEvent[]> {
    try {
      // Fetch completed bookings where user is involved
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId},event_admin_id.eq.${userId}`)
        .eq('status', 'completed')
        .order('event_date', { ascending: false });

      if (bookingsError) {
        logger.error('Failed to fetch completed bookings', { userId, error: bookingsError });
        throw bookingsError;
      }

      // Fetch completed events from events_market
      const { data: marketEvents, error: marketError } = await supabase
        .from('events_market')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (marketError) {
        logger.error('Failed to fetch completed market events', { userId, error: marketError });
      }

      // Transform bookings
      const bookingEvents: UpcomingEvent[] = (bookings || []).map((booking) => ({
        id: booking.id,
        title: booking.title,
        description: booking.description || undefined,
        event_date: booking.event_date || undefined,
        time: booking.time || undefined,
        venue: booking.venue || undefined,
        address: booking.address || undefined,
        ticket_price: booking.ticket_price || undefined,
        audience_estimate: booking.audience_estimate || undefined,
        status: booking.status,
        created_at: booking.created_at || new Date().toISOString(),
        is_sender: booking.sender_id === userId,
        is_receiver: booking.receiver_id === userId,
        is_public_after_approval: booking.is_public_after_approval || false,
        has_paid_tickets: false,
        source: 'booking' as const,
      }));

      // Transform market events
      const transformedMarketEvents: UpcomingEvent[] = (marketEvents || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        event_date: event.date,
        time: event.time || event.start_time || undefined,
        venue: event.venue || undefined,
        address: event.address || undefined,
        ticket_price: event.ticket_price || undefined,
        audience_estimate: event.expected_audience || undefined,
        status: 'completed',
        created_at: event.created_at || new Date().toISOString(),
        is_sender: false,
        is_receiver: false,
        is_public_after_approval: event.is_public || false,
        has_paid_tickets: event.has_paid_tickets || false,
        source: 'market' as const,
      }));

      // Combine and sort by event date (most recent first)
      const allEvents = [...bookingEvents, ...transformedMarketEvents].sort((a, b) => {
        const dateA = new Date(a.event_date || a.created_at);
        const dateB = new Date(b.event_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      logger.business('Fetched completed events', {
        userId,
        bookingCount: bookingEvents.length,
        marketCount: transformedMarketEvents.length,
        total: allEvents.length,
      });

      return allEvents;
    } catch (error) {
      logger.error('Error in getCompletedEvents', { userId, error });
      return [];
    }
  },
};
