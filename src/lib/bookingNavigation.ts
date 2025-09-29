/**
 * Get the correct navigation target based on booking status
 */
export const getBookingNavigationTarget = (booking: any): string => {
  if (!booking || !booking.status) {
    return '/bookings';
  }

  const { status, sender_id, receiver_id } = booking;
  
  // Get current user to determine if they're sender or receiver
  // This will be used to determine correct tab
  
  switch (status) {
    case 'pending':
      // Pending bookings go to incoming (if receiver) or sent (if sender)
      // Default to incoming for now
      return '/bookings?tab=incoming';
    
    case 'allowed':
    case 'approved_by_sender':
    case 'approved_by_receiver':
    case 'approved_by_both':
      // Ongoing negotiations
      return '/bookings?tab=ongoing';
    
    case 'upcoming':
      // Published/confirmed events
      return '/bookings?tab=upcoming';
    
    default:
      return '/bookings';
  }
};

/**
 * Get navigation target with user context
 */
export const getBookingNavigationTargetWithUser = (
  booking: any, 
  currentUserId: string
): string => {
  if (!booking || !booking.status) {
    return '/bookings';
  }

  const { status, sender_id, receiver_id } = booking;
  const isSender = currentUserId === sender_id;
  const isReceiver = currentUserId === receiver_id;
  
  switch (status) {
    case 'pending':
      // Route to correct tab based on user role
      if (isReceiver) {
        return '/bookings?tab=incoming';
      } else if (isSender) {
        return '/bookings?tab=sent';
      }
      return '/bookings?tab=incoming';
    
    case 'allowed':
    case 'approved_by_sender':
    case 'approved_by_receiver':
    case 'approved_by_both':
      // Ongoing negotiations
      return '/bookings?tab=ongoing';
    
    case 'upcoming':
      // Published/confirmed events
      return '/bookings?tab=upcoming';
    
    default:
      return '/bookings';
  }
};
