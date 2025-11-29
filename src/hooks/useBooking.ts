import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';

export const useBooking = (bookingId: string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bookings.detail(bookingId || ''),
    queryFn: async () => {
      if (!bookingId) return null;
      try {
        return await bookingService.getById(bookingId);
      } catch (err) {
        logger.error('Failed to fetch booking', { bookingId, error: err });
        throw err;
      }
    },
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    booking: data,
    loading: isLoading,
    error,
    refetch,
  };
};
