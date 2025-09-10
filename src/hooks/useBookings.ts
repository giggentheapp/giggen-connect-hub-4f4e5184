import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Booking {
  id: string;
  sender_id: string;
  receiver_id: string;
  concept_ids: string[];
  selected_concept_id: string | null;
  title: string;
  description: string | null;
  personal_message: string | null;
  price_musician: string | null;
  price_ticket: string | null;
  event_date: string | null;
  venue: string | null;
  hospitality_rider: string | null;
  tech_spec: string | null;
  status: 'pending' | 'allowed' | 'both_parties_approved' | 'upcoming' | 'completed' | 'cancelled';
  sender_confirmed: boolean;
  receiver_confirmed: boolean;
  sender_read_agreement: boolean;
  receiver_read_agreement: boolean;
  created_at: string;
  updated_at: string;
  sender_contact_info?: any;
  // New fields
  time?: string | null;
  audience_estimate?: number | null;
  ticket_price?: number | null;
  artist_fee?: number | null;
  // Door deal fields
  door_deal?: boolean;
  door_percentage?: number | null;
// New fields for enhanced privacy and workflow
  is_public_after_approval?: boolean;
  public_visibility_settings?: any;
  agreement_summary_text?: string;
  deleted_at?: string;
  deletion_reason?: string;
  contact_info_shared_at?: string;
  both_parties_approved?: boolean;
  // New workflow fields
  allowed_at?: string;
  approved_at?: string;
  published_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  receiver_allowed_at?: string;
  requires_approval?: boolean;
  last_modified_by?: string;
  last_modified_at?: string;
}


export const useBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up realtime subscription for booking updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Booking updated (as sender):', payload);
          setBookings(prev => prev.map(booking => 
            booking.id === payload.new.id ? payload.new as Booking : booking
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Booking updated (as receiver):', payload);
          setBookings(prev => prev.map(booking => 
            booking.id === payload.new.id ? payload.new as Booking : booking
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchBookings = useCallback(async (includeHistorical: boolean = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      // Filter bookings based on historical flag
      if (!includeHistorical) {
        // Active view: exclude completed and cancelled bookings
        query = query.not('status', 'in', '(completed,cancelled)');
      } else {
        // Historical view: show only completed and cancelled bookings
        query = query.in('status', ['completed', 'cancelled']);
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
          status: 'pending', // Always start with pending status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      setBookings(prev => [data as Booking, ...prev]);
      toast({
        title: "Forespørsel sendt",
        description: "Forespørselen venter på mottakers svar",
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

  const deleteBookingSecurely = async (bookingId: string, reason: string = '') => {
    try {
      // Update booking status to cancelled, which will trigger the privacy function
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          deletion_reason: reason,
          deleted_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      
      // Remove from local state or move to history
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? data as Booking : booking
      ));

      toast({
        title: "Arrangement arkivert",
        description: "Arrangementet er flyttet til historikk og sensitiv data er fjernet",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Feil ved sletting av booking",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectBooking = async (bookingId: string, rejectionReason?: string) => {
    try {
      // First update the booking status to trigger deletion logic
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Forespørsel avvist',
          last_modified_by: userId
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Process any scheduled deletions immediately
      const { error: cleanupError } = await supabase.rpc('process_scheduled_deletions');
      
      if (cleanupError) {
        console.warn('Cleanup warning (non-critical):', cleanupError.message);
      }

      // Remove from local state immediately since it's deleted
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));

      toast({
        title: "Forespørsel avvist",
        description: "Booking-forespørselen er permanent slettet fra systemet"
      });

      // Refresh bookings to ensure consistency
      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['bookings', userId] }),
          queryClient.invalidateQueries({ queryKey: ['sentBookings', userId] }),
          queryClient.invalidateQueries({ queryKey: ['receivedBookings', userId] })
        ]);
      }
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      toast({
        title: "Feil ved avvisning",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };


  const fetchHistoricalBookings = useCallback(async () => {
    return fetchBookings(true);
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    createBooking,
    updateBooking,
    deleteBookingSecurely,
    rejectBooking,
    refetch: fetchBookings,
    fetchHistorical: fetchHistoricalBookings
  };
};