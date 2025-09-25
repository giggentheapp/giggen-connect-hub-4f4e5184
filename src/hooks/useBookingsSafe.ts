import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SafeBooking {
  id: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'allowed' | 'approved_by_sender' | 'approved_by_receiver' | 'approved_by_both' | 'both_parties_approved' | 'upcoming' | 'completed' | 'cancelled';
  event_date?: string;
  venue?: string;
  created_at: string;
  updated_at: string;
  // Optional fields with safe defaults
  concept_ids?: string[];
  selected_concept_id?: string;
  personal_message?: string;
  price_musician?: string;
  time?: string;
  audience_estimate?: number;
  ticket_price?: number;
  artist_fee?: number;
  sender_contact_info?: any;
  both_parties_approved?: boolean;
  is_public_after_approval?: boolean;
}

export const useBookingsSafe = (userId?: string) => {
  const [bookings, setBookings] = useState<SafeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Safe date formatter
  const formatSafeDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('nb-NO');
    } catch {
      return '';
    }
  };

  // Fetch bookings with comprehensive error handling
  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching bookings for user:', userId);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      // Safe data transformation
      const safeBookings: SafeBooking[] = (data || []).map(booking => ({
        id: booking.id || '',
        sender_id: booking.sender_id || '',
        receiver_id: booking.receiver_id || '',
        title: booking.title || 'Untitled Booking',
        description: booking.description || undefined,
        status: booking.status || 'pending',
        event_date: booking.event_date || undefined,
        venue: booking.venue || undefined,
        created_at: booking.created_at || new Date().toISOString(),
        updated_at: booking.updated_at || new Date().toISOString(),
        concept_ids: Array.isArray(booking.concept_ids) ? booking.concept_ids : [],
        selected_concept_id: booking.selected_concept_id || undefined,
        personal_message: booking.personal_message || undefined,
        price_musician: booking.price_musician || undefined,
        time: booking.time || undefined,
        audience_estimate: booking.audience_estimate || undefined,
        ticket_price: booking.ticket_price || undefined,
        artist_fee: booking.artist_fee || undefined,
        sender_contact_info: booking.sender_contact_info || undefined,
        both_parties_approved: booking.both_parties_approved || false,
        is_public_after_approval: booking.is_public_after_approval || false,
      }));

      setBookings(safeBookings);
      console.log('✅ Bookings loaded:', safeBookings.length);
      
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
      setError(error.message || 'Failed to load bookings');
      setBookings([]);
      toast({
        title: "Kunne ikke laste bookinger",
        description: "Prøv å oppdatere siden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Safe update function
  const updateBooking = async (bookingId: string, updates: Partial<SafeBooking>) => {
    try {
      console.log('🔄 Updating booking:', bookingId, updates);
      
      const { data, error } = await supabase
        .from('bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, ...updates, updated_at: new Date().toISOString() }
          : booking
      ));

      toast({
        title: "Booking oppdatert",
        description: "Endringene er lagret",
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error updating booking:', error);
      toast({
        title: "Kunne ikke oppdatere booking",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Safe delete function
  const deleteBooking = async (bookingId: string) => {
    try {
      console.log('🗑️ Deleting booking:', bookingId);
      
      const { error } = await supabase.rpc('permanently_delete_any_booking', {
        booking_uuid: bookingId
      });

      if (error) throw error;

      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));

      toast({
        title: "Booking slettet",
        description: "Bookingen er permanent fjernet",
      });
      
    } catch (error: any) {
      console.error('❌ Error deleting booking:', error);
      toast({
        title: "Kunne ikke slette booking",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Safe reject function for pending bookings
  const rejectBooking = async (bookingId: string) => {
    try {
      console.log('❌ Rejecting booking:', bookingId);
      
      const { error } = await supabase.rpc('reject_booking_request', {
        booking_uuid: bookingId
      });

      if (error) throw error;

      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));

      toast({
        title: "Forespørsel avvist",
        description: "Forespørselen er slettet",
      });
      
    } catch (error: any) {
      console.error('❌ Error rejecting booking:', error);
      toast({
        title: "Kunne ikke avvise forespørsel",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    bookings,
    loading,
    error,
    updateBooking,
    deleteBooking,
    rejectBooking,
    refetch: fetchBookings,
    formatSafeDate,
  };
};