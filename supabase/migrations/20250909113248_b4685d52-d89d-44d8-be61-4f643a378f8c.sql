-- Fix booking status enum and workflow without touching generated columns
-- First drop dependent policies and constraints
DROP POLICY IF EXISTS "create_booking_request" ON public.bookings;
DROP POLICY IF EXISTS "update_booking_status" ON public.bookings;
DROP POLICY IF EXISTS "read_booking_details" ON public.bookings;
DROP POLICY IF EXISTS "delete_booking" ON public.bookings;
DROP POLICY IF EXISTS "public_view_upcoming_bookings" ON public.bookings;

-- Update all existing bookings with invalid statuses
UPDATE public.bookings 
SET status = 'cancelled'::booking_status 
WHERE status::text NOT IN ('pending', 'allowed', 'both_parties_approved', 'upcoming', 'completed', 'cancelled');

-- Recreate RLS policies with correct workflow
CREATE POLICY "create_booking_request" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = sender_id 
  AND is_maker(auth.uid()) 
  AND status = 'pending'::booking_status
);

CREATE POLICY "read_booking_details" ON public.bookings
FOR SELECT TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "update_booking_status" ON public.bookings
FOR UPDATE TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
)
WITH CHECK (
  (auth.uid() = sender_id OR auth.uid() = receiver_id) 
  AND status = ANY (ARRAY[
    'pending'::booking_status, 
    'allowed'::booking_status, 
    'both_parties_approved'::booking_status, 
    'upcoming'::booking_status, 
    'completed'::booking_status, 
    'cancelled'::booking_status
  ])
);

CREATE POLICY "delete_booking" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "public_view_upcoming_bookings" ON public.bookings
FOR SELECT TO authenticated
USING (
  status = 'upcoming'::booking_status 
  AND is_public_after_approval = true 
  AND auth.uid() IS NOT NULL 
  AND auth.uid() <> sender_id 
  AND auth.uid() <> receiver_id
);

-- Update database function to handle new workflow (don't touch both_parties_approved - it's generated)
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update timestamps based on status changes
  IF NEW.status = 'allowed'::booking_status AND OLD.status != 'allowed'::booking_status THEN
    NEW.allowed_at = now();
    NEW.contact_info_shared_at = now(); -- Share contact info when allowed
  END IF;
  
  IF NEW.status = 'both_parties_approved'::booking_status AND OLD.status != 'both_parties_approved'::booking_status THEN
    NEW.approved_at = now();
    -- Don't touch both_parties_approved - it's a generated column
  END IF;
  
  IF NEW.status = 'upcoming'::booking_status AND OLD.status != 'upcoming'::booking_status THEN
    NEW.published_at = now();
  END IF;
  
  IF NEW.status = 'cancelled'::booking_status AND OLD.status != 'cancelled'::booking_status THEN
    NEW.cancelled_at = now();
  END IF;
  
  -- Track who made the last modification
  NEW.last_modified_by = auth.uid();
  NEW.last_modified_at = now();
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$function$;