import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';
import { useToast } from '@/hooks/use-toast';

interface UseBookingRealtimeOptions {
  onSenderApproved?: () => void;
  onReceiverApproved?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export const useBookingRealtime = (
  initialBooking: Booking | null,
  currentUserId: string,
  options: UseBookingRealtimeOptions = {}
) => {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const { toast } = useToast();

  // Sync with initialBooking when it changes
  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  useEffect(() => {
    if (!initialBooking?.id) return;

    const channel = supabase
      .channel(`booking-${initialBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${initialBooking.id}`
        },
        (payload) => {
          try {
            const updatedBooking = payload.new as Booking;
            setBooking(prev => prev ? ({ ...prev, ...updatedBooking }) : updatedBooking);

            // Call callbacks
            const isUserSender = currentUserId === initialBooking.sender_id;
            const otherUserApprovedField = isUserSender ? 'approved_by_receiver' : 'approved_by_sender';
            const otherUserReadField = isUserSender ? 'receiver_read_agreement' : 'sender_read_agreement';
            
            if (updatedBooking[otherUserApprovedField] && !initialBooking[otherUserApprovedField]) {
              toast({
                title: "Booking bekreftet! 🎉",
                description: "Den andre parten har bekreftet bookingen",
              });
              
              if (isUserSender && options.onReceiverApproved) {
                options.onReceiverApproved();
              } else if (!isUserSender && options.onSenderApproved) {
                options.onSenderApproved();
              }
            }

            if (updatedBooking[otherUserReadField] && !initialBooking[otherUserReadField]) {
              toast({
                title: "Avtale lest! 📋",
                description: "Den andre parten har lest avtalen",
              });
            }

            if (updatedBooking.status !== initialBooking.status && options.onStatusChange) {
              options.onStatusChange(updatedBooking.status);
            }
          } catch (error) {
            console.warn('Error handling real-time update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    };
  }, [initialBooking?.id, currentUserId, toast, options]);

  return booking;
};
