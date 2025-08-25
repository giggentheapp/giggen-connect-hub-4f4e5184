import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  sender_id: string;
  receiver_id: string;
  concept_ids: string[];
  selected_concept_id: string | null;
  title: string;
  description: string | null;
  price_musician: string | null;
  price_ticket: string | null;
  event_date: string | null;
  venue: string | null;
  hospitality_rider: string | null;
  status: string;
  sender_confirmed: boolean;
  receiver_confirmed: boolean;
  sender_read_agreement: boolean;
  receiver_read_agreement: boolean;
  created_at: string;
  updated_at: string;
}

interface BookingChange {
  id: string;
  booking_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_timestamp: string;
  acknowledged_by_sender: boolean;
  acknowledged_by_receiver: boolean;
}

export const useBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error: any) {
      toast({
        title: "Feil ved lasting av bookinger",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (bookingData: Partial<Booking>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          sender_id: user.id,
          status: 'draft'
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => [data as Booking, ...prev]);
      toast({
        title: "Booking opprettet",
        description: "Forespørselen er sendt",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Feil ved oppretting av booking",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? data as Booking : booking
      ));
      
      return data;
    } catch (error: any) {
      toast({
        title: "Feil ved oppdatering av booking",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const trackChange = async (bookingId: string, fieldName: string, oldValue: string | null, newValue: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      const { error } = await supabase
        .from('booking_changes')
        .insert({
          booking_id: bookingId,
          changed_by: user.id,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue
        } as any);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error tracking change:', error);
    }
  };

  return {
    bookings,
    loading,
    createBooking,
    updateBooking,
    trackChange,
    refetch: fetchBookings
  };
};

export const useBookingChanges = (bookingId?: string) => {
  const [changes, setChanges] = useState<BookingChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    const fetchChanges = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_changes')
          .select('*')
          .eq('booking_id', bookingId)
          .order('change_timestamp', { ascending: false });

        if (error) throw error;
        setChanges(data || []);
      } catch (error) {
        console.error('Error fetching changes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [bookingId]);

  return { changes, loading };
};