-- Fix database functions that still reference 'deleted' status
-- Update the clean_booking_sensitive_data function to use 'cancelled' instead of 'deleted'
CREATE OR REPLACE FUNCTION public.clean_booking_sensitive_data(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update booking to remove sensitive data
  UPDATE public.bookings 
  SET 
    sender_contact_info = NULL,
    personal_message = NULL,
    price_musician = NULL,
    artist_fee = NULL,
    hospitality_rider = NULL,
    hospitality_rider_status = 'not_provided',
    contact_info_shared_at = NULL,
    -- Keep only basic metadata
    description = CASE 
      WHEN status = 'cancelled' THEN 'Booking slettet - sensitiv data fjernet'
      ELSE description 
    END
  WHERE id = booking_uuid;
  
  -- Delete related booking changes
  UPDATE public.booking_changes 
  SET 
    old_value = '[SLETTET]',
    new_value = '[SLETTET]'
  WHERE booking_id = booking_uuid;
END;
$function$;

-- Update the trigger function to use 'cancelled' instead of 'deleted'
CREATE OR REPLACE FUNCTION public.update_booking_contact_shared_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- When both parties confirm, set contact sharing timestamp
  IF NEW.both_parties_approved = true AND OLD.both_parties_approved = false THEN
    NEW.contact_info_shared_at = now();
  END IF;
  
  -- When booking is cancelled (previously deleted), set deletion timestamp and clean data
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.deleted_at IS NULL THEN
    NEW.deleted_at = now();
    PERFORM public.clean_booking_sensitive_data(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;