import { NavigateFunction, Location } from 'react-router-dom';
import { navigateBack as baseNavigateBack } from './navigation';

/**
 * Smart navigation helper that remembers where user came from
 * 
 * Now uses centralized navigation logic
 */
export const navigateBack = (
  navigate: NavigateFunction,
  location: Location,
  fallback: string = '/'
): void => {
  baseNavigateBack(navigate, location, fallback);
};

/**
 * Get the correct navigation target based on booking status
 * 
 * Returns profile URL with bookings section and appropriate tab
 * 
 * @param booking - Booking object with status
 * @param userId - Current user ID (for generating profile URL)
 * @returns Profile URL with bookings section and tab
 */
export const getBookingNavigationTarget = (
  booking: any,
  userId?: string
): string => {
  if (!booking || !booking.status) {
    // If we have userId, return profile URL, otherwise return '/bookings' which will redirect via BookingsRedirect
    return userId ? `/profile/${userId}?section=bookings` : '/bookings';
  }

  const { status } = booking;
  let tab = 'incoming';
  
  switch (status) {
    case 'pending':
      tab = 'incoming';
      break;
    
    case 'allowed':
    case 'approved_by_sender':
    case 'approved_by_receiver':
    case 'approved_by_both':
      tab = 'ongoing';
      break;
    
    case 'upcoming':
      tab = 'upcoming';
      break;
    
    default:
      tab = 'incoming';
  }
  
  // If we have userId, return profile URL with tab, otherwise return '/bookings' with tab for redirect handling
  if (userId) {
    return `/profile/${userId}?section=bookings&tab=${tab}`;
  }
  
  // Fallback to '/bookings' which will be handled by BookingsRedirect component
  return `/bookings?tab=${tab}`;
};

/**
 * Get navigation target with user context
 * 
 * Returns profile URL with bookings section and appropriate tab based on user role
 * 
 * @param booking - Booking object with status
 * @param currentUserId - Current user ID
 * @returns Profile URL with bookings section and tab
 */
export const getBookingNavigationTargetWithUser = (
  booking: any, 
  currentUserId: string
): string => {
  if (!booking || !booking.status) {
    return `/profile/${currentUserId}?section=bookings`;
  }

  const { status, sender_id, receiver_id } = booking;
  const isSender = currentUserId === sender_id;
  const isReceiver = currentUserId === receiver_id;
  
  let tab = 'incoming';
  
  switch (status) {
    case 'pending':
      // Route to correct tab based on user role
      if (isReceiver) {
        tab = 'incoming';
      } else if (isSender) {
        tab = 'sent';
      } else {
        tab = 'incoming';
      }
      break;
    
    case 'allowed':
    case 'approved_by_sender':
    case 'approved_by_receiver':
    case 'approved_by_both':
      tab = 'ongoing';
      break;
    
    case 'upcoming':
      tab = 'upcoming';
      break;
    
    default:
      tab = 'incoming';
  }
  
  return `/profile/${currentUserId}?section=bookings&tab=${tab}`;
};
