-- Fix the trigger conflict by consolidating the booking update logic and removing duplicate clean_booking_sensitive_data calls

-- Drop the conflicting trigger
DROP TRIGGER IF EXISTS update_booking_contact_shared_timestamp ON public.bookings;

-- Update the main trigger function to handle all logic in one place
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update timestamps based on status changes
  IF NEW.status = 'allowed'::booking_status AND OLD.status != 'allowed'::booking_status THEN
    NEW.allowed_at = COALESCE(NEW.allowed_at, now());
    NEW.contact_info_shared_at = COALESCE(NEW.contact_info_shared_at, now());
  END IF;
  
  IF NEW.status = 'both_parties_approved'::booking_status AND OLD.status != 'both_parties_approved'::booking_status THEN
    NEW.approved_at = COALESCE(NEW.approved_at, now());
  END IF;
  
  IF NEW.status = 'upcoming'::booking_status AND OLD.status != 'upcoming'::booking_status THEN
    NEW.published_at = COALESCE(NEW.published_at, now());
  END IF;
  
  -- Handle both parties approved logic (moved from the other trigger)
  IF NEW.both_parties_approved = true AND OLD.both_parties_approved = false THEN
    NEW.contact_info_shared_at = COALESCE(NEW.contact_info_shared_at, now());
  END IF;
  
  -- Handle cancellation logic (consolidated from both triggers)
  IF NEW.status = 'cancelled'::booking_status AND OLD.status != 'cancelled'::booking_status THEN
    -- Set both cancelled_at and rejected_at to the same timestamp if not already set
    NEW.cancelled_at = COALESCE(NEW.cancelled_at, NEW.rejected_at, now());
    NEW.rejected_at = COALESCE(NEW.rejected_at, NEW.cancelled_at, now());
    -- Set deletion timestamp for cleanup logic
    NEW.deleted_at = COALESCE(NEW.deleted_at, now());
    
    -- Clear sensitive data directly in the trigger instead of calling separate function
    -- This prevents the tuple conflict
    NEW.sender_contact_info = NULL;
    NEW.personal_message = NULL;
    NEW.price_musician = NULL;
    NEW.artist_fee = NULL;
    NEW.hospitality_rider = NULL;
    NEW.hospitality_rider_status = 'not_provided';
    NEW.contact_info_shared_at = NULL;
    NEW.description = CASE 
      WHEN NEW.status = 'cancelled'::booking_status THEN 'Booking arkivert - sensitiv data fjernet'
      ELSE NEW.description 
    END;
  END IF;
  
  -- Track who made the last modification
  NEW.last_modified_by = COALESCE(NEW.last_modified_by, auth.uid());
  NEW.last_modified_at = COALESCE(NEW.last_modified_at, now());
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$function$;