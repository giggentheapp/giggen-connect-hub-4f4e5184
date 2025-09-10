-- Fix booking rejection to use permanent deletion instead of soft deletion
-- Remove conflicting trigger logic and implement proper deletion workflow

-- First, let's create a function to permanently delete rejected bookings
CREATE OR REPLACE FUNCTION public.permanently_delete_booking(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete related records first to avoid foreign key conflicts
  
  -- 1. Delete booking changes for this booking
  DELETE FROM public.booking_changes 
  WHERE booking_id = booking_uuid;
  
  -- 2. Delete any events_market entries created from this booking
  DELETE FROM public.events_market 
  WHERE id IN (
    SELECT em.id FROM public.events_market em
    INNER JOIN public.bookings b ON em.created_by = b.sender_id OR em.created_by = b.receiver_id
    WHERE b.id = booking_uuid
  );
  
  -- 3. Finally, delete the booking itself
  DELETE FROM public.bookings 
  WHERE id = booking_uuid;
  
  -- Log the deletion for debugging
  RAISE NOTICE 'Booking % permanently deleted', booking_uuid;
END;
$$;

-- Create a new function to handle booking status changes with proper rejection logic
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Handle permanent deletion for rejected bookings
  IF NEW.status = 'cancelled'::booking_status AND OLD.status = 'pending'::booking_status THEN
    -- This is a rejection of a pending request - should be permanently deleted
    -- We'll handle the deletion after the update completes
    NEW.deleted_at = now();
    NEW.rejection_reason = COALESCE(NEW.rejection_reason, 'Forespørsel avvist');
    
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

-- Create a function to handle post-update cleanup (permanent deletion)
CREATE OR REPLACE FUNCTION public.cleanup_rejected_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If this was a rejection of a pending booking, schedule permanent deletion
  IF NEW.status = 'cancelled'::booking_status AND 
     OLD.status = 'pending'::booking_status AND 
     NEW.deleted_at IS NOT NULL THEN
    
    -- Use a deferred deletion to avoid trigger conflicts
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
      OLD.status::text,
      'SCHEDULED_FOR_DELETION',
      'pending',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing conflicting triggers
DROP TRIGGER IF EXISTS update_booking_status_timestamps_trigger ON public.bookings;
DROP TRIGGER IF EXISTS update_booking_contact_shared_timestamp_trigger ON public.bookings;

-- Create new organized triggers
CREATE TRIGGER handle_booking_status_change_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_status_change();

CREATE TRIGGER cleanup_rejected_bookings_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_rejected_bookings();

-- Keep the simple updated_at trigger
CREATE TRIGGER update_booking_updated_at_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_updated_at();

-- Create a function to process scheduled deletions (can be called periodically)
CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deletion_record RECORD;
BEGIN
  -- Process all scheduled deletions
  FOR deletion_record IN 
    SELECT bc.booking_id
    FROM public.booking_changes bc
    INNER JOIN public.bookings b ON bc.booking_id = b.id
    WHERE bc.field_name = 'permanent_deletion_scheduled'
      AND bc.new_value = 'SCHEDULED_FOR_DELETION'
      AND b.status = 'cancelled'::booking_status
      AND b.deleted_at IS NOT NULL
      AND b.deleted_at < (now() - INTERVAL '1 minute') -- Wait 1 minute to ensure all updates are complete
  LOOP
    -- Permanently delete the booking
    PERFORM public.permanently_delete_booking(deletion_record.booking_id);
  END LOOP;
END;
$$;

-- Add foreign key constraints with CASCADE DELETE to prevent orphaned records
-- Note: We need to check existing constraints first

-- Add CASCADE DELETE to booking_changes if not already set
DO $$ 
BEGIN
  -- Drop and recreate the foreign key with CASCADE DELETE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%booking_changes%booking%' 
    AND table_name = 'booking_changes'
  ) THEN
    ALTER TABLE public.booking_changes 
    DROP CONSTRAINT IF EXISTS booking_changes_booking_id_fkey;
  END IF;
  
  ALTER TABLE public.booking_changes 
  ADD CONSTRAINT booking_changes_booking_id_fkey 
  FOREIGN KEY (booking_id) 
  REFERENCES public.bookings(id) 
  ON DELETE CASCADE;
END $$;