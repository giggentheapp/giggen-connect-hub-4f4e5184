import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { CreateBookingRequest, UpdateBookingRequest } from '@/types/booking';
import { logger } from '@/utils/logger';

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest & { senderId: string }) => {
      return await bookingService.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.sender_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.receiver_id) });
      
      logger.business('Booking created', { bookingId: data.id });
      toast({
        title: 'Forespørsel sendt',
        description: 'Forespørselen venter på mottakers svar',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to create booking', error);
      toast({
        title: 'Feil ved oppretting av booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: string; updates: UpdateBookingRequest }) => {
      return await bookingService.update(bookingId, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.sender_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.receiver_id) });
      
      logger.business('Booking updated', { bookingId: data.id });
    },
    onError: (error: Error) => {
      logger.error('Failed to update booking', error);
      toast({
        title: 'Feil ved oppdatering av booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      return await bookingService.delete(bookingId, reason);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.sender_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.user(data.receiver_id) });
      
      logger.business('Booking deleted', { bookingId: data.id });
      toast({
        title: 'Arrangement arkivert',
        description: 'Arrangementet er flyttet til historikk og sensitiv data er fjernet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete booking', error);
      toast({
        title: 'Feil ved sletting av booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      return await bookingService.reject(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      
      toast({
        title: 'Forespørsel avvist',
        description: 'Booking-forespørselen er permanent slettet fra systemet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to reject booking', error);
      toast({
        title: 'Feil ved avvisning',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const usePermanentlyDeleteBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      return await bookingService.permanentlyDelete(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      
      toast({
        title: 'Booking permanent slettet',
        description: 'Bookingen og all relatert data er permanent fjernet fra systemet',
      });
    },
    onError: (error: Error) => {
      logger.error('Failed to permanently delete booking', error);
      toast({
        title: 'Feil ved sletting',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
