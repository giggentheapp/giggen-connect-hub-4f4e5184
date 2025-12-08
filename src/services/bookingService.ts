import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database } from "@/integrations/supabase/types";
import type { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest 
} from "@/types/booking";

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const bookingService = {
  /**
   * Fetch a single booking by ID with related profile data
   */
  async getById(bookingId: string): Promise<Booking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          sender:profiles!bookings_sender_id_fkey(*),
          receiver:profiles!bookings_receiver_id_fkey(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        logger.error('Failed to fetch booking by ID', { bookingId, error });
        throw error;
      }

      return data as unknown as Booking;
    } catch (error) {
      logger.error('Error in getById', { bookingId, error });
      throw error;
    }
  },

  /**
   * Fetch all bookings for a user (as sender or receiver)
   */
  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch user bookings', { userId, error });
        throw error;
      }

      return (data || []) as unknown as Booking[];
    } catch (error) {
      logger.error('Error in getUserBookings', { userId, error });
      return [];
    }
  },

  /**
   * Create a new booking
   */
  async create(bookingData: CreateBookingRequest & { senderId: string }): Promise<Booking> {
    try {
      logger.business('Creating new booking', { 
        senderId: bookingData.senderId,
        receiverId: bookingData.receiverId,
        title: bookingData.title
      });

      // Insert the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          sender_id: bookingData.senderId,
          receiver_id: bookingData.receiverId,
          title: bookingData.title,
          description: bookingData.description || null,
          event_date: bookingData.eventDate || null,
          venue: bookingData.venue || null,
          address: bookingData.address || null,
          latitude: bookingData.coordinates?.latitude || null,
          longitude: bookingData.coordinates?.longitude || null,
          concept_ids: bookingData.conceptIds || [],
          selected_concept_id: bookingData.selectedConceptId || null,
          personal_message: bookingData.personalMessage || null,
          sender_contact_info: bookingData.contactInfo || null,
          time: bookingData.time || null,
          status: 'pending',
          approved_by_sender: false,
          approved_by_receiver: false,
        })
        .select()
        .single();

      if (bookingError) {
        logger.error('Failed to create booking', { bookingData, error: bookingError });
        throw bookingError;
      }

      // Fetch sender profile for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('user_id', bookingData.senderId)
        .single();

      // Create notification for receiver
      const senderName = senderProfile?.display_name || senderProfile?.username || 'En bruker';
      await supabase
        .from('notifications')
        .insert({
          user_id: bookingData.receiverId,
          type: 'booking_request',
          title: 'Ny bookingforespørsel',
          message: `${senderName} har sendt deg en bookingforespørsel`,
          link: `/bookings?tab=incoming`
        });

      logger.business('Booking created successfully', { bookingId: booking.id });

      return booking as unknown as Booking;
    } catch (error) {
      logger.error('Error in create', { bookingData, error });
      throw error;
    }
  },

  /**
   * Update an existing booking
   */
  async update(bookingId: string, updates: UpdateBookingRequest): Promise<Booking> {
    try {
      logger.business('Updating booking', { bookingId, updates });

      const { data, error } = await supabase
        .from('bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update booking', { bookingId, updates, error });
        throw error;
      }

      logger.business('Booking updated successfully', { bookingId });

      return data as unknown as Booking;
    } catch (error) {
      logger.error('Error in update', { bookingId, updates, error });
      throw error;
    }
  },

  /**
   * Soft delete a booking (mark as cancelled)
   */
  async delete(bookingId: string, reason?: string): Promise<Booking> {
    try {
      logger.business('Deleting booking (soft delete)', { bookingId, reason });

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          deletion_reason: reason || null,
          deleted_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to delete booking', { bookingId, error });
        throw error;
      }

      logger.business('Booking deleted successfully', { bookingId });

      return data as unknown as Booking;
    } catch (error) {
      logger.error('Error in delete', { bookingId, error });
      throw error;
    }
  },

  /**
   * Reject a booking request (permanent deletion via RPC)
   */
  async reject(bookingId: string): Promise<void> {
    try {
      logger.business('Rejecting booking request', { bookingId });

      const { error } = await supabase
        .rpc('reject_booking_request', {
          booking_uuid: bookingId
        });

      if (error) {
        logger.error('Failed to reject booking', { bookingId, error });
        throw error;
      }

      logger.business('Booking rejected successfully', { bookingId });
    } catch (error) {
      logger.error('Error in reject', { bookingId, error });
      throw error;
    }
  },

  /**
   * Permanently delete a booking (via RPC)
   */
  async permanentlyDelete(bookingId: string): Promise<void> {
    try {
      logger.business('Permanently deleting booking', { bookingId });

      const { error } = await supabase
        .rpc('permanently_delete_any_booking', {
          booking_uuid: bookingId
        });

      if (error) {
        logger.error('Failed to permanently delete booking', { bookingId, error });
        throw error;
      }

      logger.business('Booking permanently deleted successfully', { bookingId });
    } catch (error) {
      logger.error('Error in permanentlyDelete', { bookingId, error });
      throw error;
    }
  },

  /**
   * Fetches maker profile for a booking
   */
  async getMakerProfile(receiverId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio')
        .eq('user_id', receiverId)
        .maybeSingle();

      return data;
    } catch (error) {
      logger.error('Failed to fetch maker profile', { receiverId, error });
      throw error;
    }
  },

  /**
   * Fetches portfolio attachments for a booking
   */
  async getPortfolioAttachments(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('booking_portfolio_attachments')
        .select(`
          id,
          booking_id,
          portfolio_file_id,
          attached_by,
          created_at,
          portfolio_file:profile_portfolio(
            id,
            filename,
            file_path,
            file_type,
            file_url,
            mime_type,
            title,
            description,
            user_id
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch portfolio attachments', { bookingId, error });
      throw error;
    }
  },

  /**
   * Checks if both parties have approved the booking
   */
  bothPartiesApproved(booking: Booking): boolean {
    return booking.approved_by_sender && booking.approved_by_receiver;
  },

  /**
   * Checks if both parties have read the agreement
   */
  bothPartiesReadAgreement(booking: Booking): boolean {
    return Boolean(booking.sender_read_agreement && booking.receiver_read_agreement);
  },

  /**
   * Determines if booking can be published
   */
  canBePublished(booking: Booking): boolean {
    return this.bothPartiesApproved(booking) && this.bothPartiesReadAgreement(booking);
  },

  /**
   * Gets the display text for payment type
   */
  getPaymentDisplayText(booking: Booking): string {
    if (booking.door_deal) {
      return `${booking.door_percentage || 50}% av dør`;
    }
    if (booking.by_agreement) {
      return 'Etter avtale';
    }
    return `${booking.artist_fee || booking.price_musician || '0'} kr`;
  }
};
