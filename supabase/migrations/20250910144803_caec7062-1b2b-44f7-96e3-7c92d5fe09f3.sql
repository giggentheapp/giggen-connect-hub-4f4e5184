-- Fix rejection logic by removing rejection_reason column references and simplifying permanent deletion
-- Since rejected requests are permanently deleted, we don't need to store rejection reasons

-- Update the booking status change function to remove rejection_reason references
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Handle permanent deletion for rejected bookings (pending -> cancelled)
  IF NEW.status = 'cancelled'::booking_status AND OLD.status = 'pending'::booking_status THEN
    -- This is a rejection of a pending request - schedule for permanent deletion
    NEW.deleted_at = now();
    NEW.rejected_at = COALESCE(NEW.rejected_at, now());
    
    -- Clear sensitive data immediately
    NEW.sender_contact_info = NULL;
    NEW.personal_message = NULL;
    NEW.price_musician = NULL;
    NEW.artist_fee = NULL;
    NEW.hospitality_rider = NULL;
    NEW.contact_info_shared_at = NULL;
    
    RETURN NEW;
  END IF;
  
  -- Handle archival for approved bookings that are cancelled later
  IF NEW.status = 'cancelled'::booking_status AND OLD.status IN ('allowed'::booking_status, 'both_parties_approved'::booking_status, 'upcoming'::booking_status) THEN
    -- This is cancellation of an approved booking - archive it
    NEW.cancelled_at = COALESCE(NEW.cancelled_at, now());
    NEW.deleted_at = now();
    
    -- Clear sensitive data for archival
    NEW.sender_contact_info = NULL;
    NEW.personal_message = NULL;
    NEW.price_musician = NULL;
    NEW.artist_fee = NULL;
    NEW.hospitality_rider = NULL;
    NEW.contact_info_shared_at = NULL;
    NEW.description = 'Booking arkivert - sensitiv data fjernet';
    
    RETURN NEW;
  END IF;
  
  -- Handle other status changes and timestamps
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
  
  -- Handle both parties approved logic
  IF NEW.both_parties_approved = true AND (OLD.both_parties_approved IS NULL OR OLD.both_parties_approved = false) THEN
    NEW.contact_info_shared_at = COALESCE(NEW.contact_info_shared_at, now());
  END IF;
  
  -- Track modifications
  NEW.last_modified_by = COALESCE(NEW.last_modified_by, auth.uid());
  NEW.last_modified_at = COALESCE(NEW.last_modified_at, now());
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Simplify the cleanup function to immediately delete rejected bookings
CREATE OR REPLACE FUNCTION public.cleanup_rejected_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If this was a rejection of a pending booking, schedule immediate permanent deletion
  IF NEW.status = 'cancelled'::booking_status AND 
     OLD.status = 'pending'::booking_status AND 
     NEW.deleted_at IS NOT NULL THEN
    
    -- Schedule for immediate deletion using a deferred approach
    INSERT INTO public.booking_changes (
      booking_id,
      changed_by,
      field_name,
      old_value,
      new_value,
      status,
      requires_approval
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.last_modified_by),
      'permanent_deletion_scheduled',
      'pending',
      'DELETED',
      'completed',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Simplify the deletion processing function
CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deletion_record RECORD;
BEGIN
  -- Process all scheduled deletions for rejected bookings
  FOR deletion_record IN 
    SELECT bc.booking_id
    FROM public.booking_changes bc
    INNER JOIN public.bookings b ON bc.booking_id = b.id
    WHERE bc.field_name = 'permanent_deletion_scheduled'
      AND bc.new_value = 'DELETED'
      AND bc.status = 'completed'
      AND b.status = 'cancelled'::booking_status
      AND b.deleted_at IS NOT NULL
  LOOP
    -- Permanently delete the booking (CASCADE will handle related records)
    PERFORM public.permanently_delete_booking(deletion_record.booking_id);
  END LOOP;
END;
$$;

-- Create a simple, direct rejection function that bypasses status updates
CREATE OR REPLACE FUNCTION public.reject_booking_request(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  booking_status text;
BEGIN
  -- Check if booking exists and is in pending status
  SELECT status INTO booking_status
  FROM public.bookings 
  WHERE id = booking_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  IF booking_status != 'pending' THEN
    RAISE EXCEPTION 'Can only reject pending bookings';
  END IF;
  
  -- Directly delete the booking and all related records
  PERFORM public.permanently_delete_booking(booking_uuid);
  
  RAISE NOTICE 'Pending booking % permanently deleted', booking_uuid;
END;
$$;