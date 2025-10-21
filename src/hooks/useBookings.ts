import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Booking, CreateBookingRequest, UpdateBookingRequest } from '@/types/booking';
import { getErrorMessage } from '@/types/common';
import { logger } from '@/utils/logger';

export const useBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Set up realtime subscription for booking updates
  useEffect(() => {
    if (!userId || isSafari) {
      if (isSafari) {
        logger.debug('Skipping realtime for Safari browser');
      }
      return;
    }

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
          logger.debug('Booking updated (as sender)', { bookingId: payload.new.id });
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
          logger.debug('Booking updated (as receiver)', { bookingId: payload.new.id });
          setBookings(prev => prev.map(booking => 
            booking.id === payload.new.id ? payload.new as Booking : booking
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isSafari]);

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

      // Always fetch all bookings - filter in UI instead of changing data source
      const { data, error } = await query;

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Feil ved lasting av bookinger",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (bookingData: CreateBookingRequest): Promise<Booking> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      // Get sender profile for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const insertData = {
        receiver_id: bookingData.receiverId,
        concept_ids: bookingData.conceptIds,
        selected_concept_id: bookingData.selectedConceptId || null,
        title: bookingData.title,
        description: bookingData.description || null,
        event_date: bookingData.eventDate || null,
        time: bookingData.time || null,
        venue: bookingData.venue || null,
        address: bookingData.address || null,
        latitude: bookingData.coordinates?.latitude || null,
        longitude: bookingData.coordinates?.longitude || null,
        personal_message: bookingData.personalMessage || null,
        sender_contact_info: bookingData.contactInfo || null,
        sender_id: user.id,
        status: 'pending' as const,
        approved_by_sender: false,
        approved_by_receiver: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      const newBooking = data as Booking;
      setBookings(prev => [newBooking, ...prev]);
      
      // Create notification for receiver
      const senderName = senderProfile?.display_name || 'En bruker';
      await supabase
        .from('notifications')
        .insert({
          user_id: bookingData.receiverId,
          type: 'booking_request',
          title: 'Ny bookingforespørsel',
          message: `${senderName} vil booke deg`,
          link: '/dashboard?section=bookings',
        });
      
      logger.business('Booking created', { bookingId: newBooking.id, receiverId: bookingData.receiverId });
      toast({
        title: "Forespørsel sendt",
        description: "Forespørselen venter på mottakers svar",
      });
      
      return newBooking;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Feil ved oppretting av booking",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBooking = async (bookingId: string, updates: UpdateBookingRequest): Promise<Booking> => {
    try {
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
      
      const updatedBooking = data as Booking;
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? updatedBooking : booking
      ));
      
      logger.business('Booking updated', { bookingId, updates });
      return updatedBooking;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.error('Failed to update booking', error);
      toast({
        title: "Feil ved oppdatering av booking",
        description: message,
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
      
      return data as Booking;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast({
        title: "Feil ved sletting av booking",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectBooking = async (bookingId: string) => {
    try {
      // Use the direct rejection function that permanently deletes pending bookings
      const { error: rejectError } = await supabase.rpc('reject_booking_request', {
        booking_uuid: bookingId
      });

      if (rejectError) throw rejectError;

      // Remove from local state immediately since it's permanently deleted
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
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.error('Failed to reject booking', error);
      toast({
        title: "Feil ved avvisning",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const permanentlyDeleteBooking = async (bookingId: string) => {
    try {
      // Use the new function that handles permanent deletion for any status
      const { error } = await supabase.rpc('permanently_delete_any_booking', {
        booking_uuid: bookingId
      });

      if (error) throw error;

      // Remove from local state immediately since it's permanently deleted
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));

      toast({
        title: "Booking permanent slettet",
        description: "Bookingen og all relatert data er permanent fjernet fra systemet"
      });

      // Refresh bookings to ensure consistency
      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['bookings', userId] }),
          queryClient.invalidateQueries({ queryKey: ['sentBookings', userId] }),
          queryClient.invalidateQueries({ queryKey: ['receivedBookings', userId] })
        ]);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.error('Failed to permanently delete booking', error);
      toast({
        title: "Feil ved sletting",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    bookings,
    loading,
    createBooking,
    updateBooking,
    deleteBookingSecurely,
    rejectBooking,
    permanentlyDeleteBooking,
    refetch: fetchBookings
  };
};