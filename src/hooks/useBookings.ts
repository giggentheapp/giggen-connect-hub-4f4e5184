import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bookingService } from '@/services/bookingService';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';
import { 
  useCreateBooking, 
  useUpdateBooking, 
  useDeleteBooking, 
  useRejectBooking, 
  usePermanentlyDeleteBooking 
} from './useBookingMutations';

export const useBookings = (userId?: string) => {
  // Query for bookings
  const { data: bookings = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.bookings.user(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return await bookingService.getUserBookings(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createBookingMutation = useCreateBooking();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();
  const rejectBookingMutation = useRejectBooking();
  const permanentlyDeleteBookingMutation = usePermanentlyDeleteBooking();

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
          refetch();
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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isSafari, refetch]);

  return {
    bookings,
    loading,
    error,
    createBooking: createBookingMutation.mutateAsync,
    updateBooking: (bookingId: string, updates: any) => 
      updateBookingMutation.mutateAsync({ bookingId, updates }),
    deleteBookingSecurely: (bookingId: string, reason?: string) => 
      deleteBookingMutation.mutateAsync({ bookingId, reason }),
    rejectBooking: rejectBookingMutation.mutateAsync,
    permanentlyDeleteBooking: permanentlyDeleteBookingMutation.mutateAsync,
    refetch,
  };
};
