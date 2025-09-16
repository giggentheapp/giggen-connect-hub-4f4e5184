-- Fix the booking approval trigger to not override 'upcoming' status
CREATE OR REPLACE FUNCTION public.handle_booking_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Don't change status if it's already 'upcoming' (published)
  IF NEW.status = 'upcoming'::booking_status THEN
    -- Set approval timestamps if not already set
    IF NEW.approved_by_sender = true AND NEW.sender_approved_at IS NULL THEN
      NEW.sender_approved_at = now();
    END IF;
    
    IF NEW.approved_by_receiver = true AND NEW.receiver_approved_at IS NULL THEN
      NEW.receiver_approved_at = now();
    END IF;

    -- Keep the status as upcoming and update timestamps
    NEW.last_modified_by = COALESCE(NEW.last_modified_by, auth.uid());
    NEW.last_modified_at = COALESCE(NEW.last_modified_at, now());
    NEW.updated_at = now();
    
    RETURN NEW;
  END IF;

  -- For non-upcoming statuses, update status based on approval states
  IF NEW.approved_by_sender = true AND NEW.approved_by_receiver = true THEN
    NEW.status = 'approved_by_both'::booking_status;
    NEW.approved_at = COALESCE(NEW.approved_at, now());
  ELSIF NEW.approved_by_sender = true AND NEW.approved_by_receiver = false THEN
    NEW.status = 'approved_by_sender'::booking_status;
  ELSIF NEW.approved_by_sender = false AND NEW.approved_by_receiver = true THEN
    NEW.status = 'approved_by_receiver'::booking_status;
  END IF;

  -- Set approval timestamps
  IF NEW.approved_by_sender = true AND OLD.approved_by_sender = false THEN
    NEW.sender_approved_at = COALESCE(NEW.sender_approved_at, now());
  END IF;
  
  IF NEW.approved_by_receiver = true AND OLD.approved_by_receiver = false THEN
    NEW.receiver_approved_at = COALESCE(NEW.receiver_approved_at, now());
  END IF;

  -- Update general timestamps
  NEW.last_modified_by = COALESCE(NEW.last_modified_by, auth.uid());
  NEW.last_modified_at = COALESCE(NEW.last_modified_at, now());
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$function$

-- Fix the existing published booking to have correct status
UPDATE bookings 
SET status = 'upcoming'
WHERE id = 'f6197c25-9b9b-40cc-a38d-312712f4f324' 
AND status = 'approved_by_both' 
AND published_by_sender = true 
AND published_by_receiver = true;