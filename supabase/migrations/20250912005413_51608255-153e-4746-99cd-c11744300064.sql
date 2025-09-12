-- Create improved permanent deletion function that handles all statuses correctly
CREATE OR REPLACE FUNCTION public.permanently_delete_booking_with_relations(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete all related records first to avoid foreign key conflicts
  
  -- 1. Delete booking changes for this booking
  DELETE FROM public.booking_changes 
  WHERE booking_id = booking_uuid;
  
  -- 2. Delete any events_market entries that might be related to this booking
  DELETE FROM public.events_market 
  WHERE created_by IN (
    SELECT sender_id FROM public.bookings WHERE id = booking_uuid
    UNION
    SELECT receiver_id FROM public.bookings WHERE id = booking_uuid
  )
  AND title IN (
    SELECT title FROM public.bookings WHERE id = booking_uuid
  );
  
  -- 3. Finally, delete the booking itself
  DELETE FROM public.bookings 
  WHERE id = booking_uuid;
  
  -- Log the successful deletion
  RAISE NOTICE 'Booking % and all related records permanently deleted', booking_uuid;
END;
$$;

-- Update the reject_booking_request function to handle any status for permanent deletion
CREATE OR REPLACE FUNCTION public.permanently_delete_any_booking(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if booking exists
  IF NOT EXISTS(SELECT 1 FROM public.bookings WHERE id = booking_uuid) THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Permanently delete the booking regardless of status
  PERFORM public.permanently_delete_booking_with_relations(booking_uuid);
  
  RAISE NOTICE 'Booking % permanently deleted regardless of status', booking_uuid;
END;
$$;