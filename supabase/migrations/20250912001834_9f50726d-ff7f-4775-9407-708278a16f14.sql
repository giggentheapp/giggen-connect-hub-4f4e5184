-- Update booking_status enum to include new approval states
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_sender';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_receiver';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_both';

-- Add new publishing fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS published_by_sender boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_by_receiver boolean DEFAULT false;

-- Update existing bookings to use new status system
UPDATE public.bookings 
SET status = CASE 
  WHEN status = 'both_parties_approved' THEN 'approved_by_both'::booking_status
  WHEN status = 'allowed' AND approved_by_sender = true AND approved_by_receiver = false THEN 'approved_by_sender'::booking_status
  WHEN status = 'allowed' AND approved_by_sender = false AND approved_by_receiver = true THEN 'approved_by_receiver'::booking_status
  WHEN status = 'allowed' AND approved_by_sender = true AND approved_by_receiver = true THEN 'approved_by_both'::booking_status
  ELSE status
END;

-- Create function to handle progressive approval logic
CREATE OR REPLACE FUNCTION public.handle_booking_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update status based on approval states
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
$function$;

-- Create trigger for booking approval handling
DROP TRIGGER IF EXISTS handle_booking_approval_trigger ON public.bookings;
CREATE TRIGGER handle_booking_approval_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_approval();

-- Update RLS policies to include new statuses
DROP POLICY IF EXISTS "update_booking_status" ON public.bookings;
CREATE POLICY "update_booking_status" ON public.bookings
FOR UPDATE USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id))
WITH CHECK (
  ((auth.uid() = sender_id) OR (auth.uid() = receiver_id)) 
  AND (status = ANY (ARRAY[
    'pending'::booking_status, 
    'allowed'::booking_status,
    'approved_by_sender'::booking_status,
    'approved_by_receiver'::booking_status,
    'approved_by_both'::booking_status,
    'upcoming'::booking_status, 
    'completed'::booking_status, 
    'cancelled'::booking_status
  ]))
);