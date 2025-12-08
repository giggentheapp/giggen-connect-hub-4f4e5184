import { format } from 'date-fns';
import { Booking } from '@/types/booking';

/**
 * Safely formats a date string, handling invalid dates
 */
export const formatSafeDate = (dateString: string | null | undefined): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ugyldig dato';
    return format(date, 'dd.MM.yyyy');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Ugyldig dato';
  }
};

/**
 * Checks if user is sender of booking
 */
export const isSender = (userId: string, booking: Booking): boolean => {
  return userId === booking.sender_id;
};

/**
 * Checks if user is receiver of booking
 */
export const isReceiver = (userId: string, booking: Booking): boolean => {
  return userId === booking.receiver_id;
};

/**
 * Gets the appropriate status badge variant
 */
export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'upcoming':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

/**
 * Gets display text for payment type
 */
export const getPaymentDisplayText = (booking: Booking): string => {
  if (booking.door_deal) {
    return `${booking.door_percentage || 50}% av dør`;
  }
  if (booking.by_agreement) {
    return 'Etter avtale';
  }
  return `${booking.artist_fee || booking.price_musician || '0'} kr`;
};

/**
 * Checks if both parties have approved the booking
 */
export const bothPartiesApproved = (booking: Booking): boolean => {
  return booking.approved_by_sender && booking.approved_by_receiver;
};

/**
 * Checks if both parties have read the agreement
 */
export const bothPartiesReadAgreement = (booking: Booking): boolean => {
  return Boolean(booking.sender_read_agreement && booking.receiver_read_agreement);
};

/**
 * Determines if booking can be published
 */
export const canBePublished = (booking: Booking): boolean => {
  return bothPartiesApproved(booking) && bothPartiesReadAgreement(booking);
};
