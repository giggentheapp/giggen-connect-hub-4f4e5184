-- Fix RLS policy for booking_portfolio_attachments
-- Use SECURITY DEFINER function to check portfolio file ownership without RLS blocking

-- Step 1: Create SECURITY DEFINER function to check portfolio file ownership
CREATE OR REPLACE FUNCTION public.is_portfolio_file_owned_by_user(
  p_portfolio_file_id UUID,
  p_user_id UUID
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profile_portfolio pp
    WHERE pp.id = p_portfolio_file_id 
    AND pp.user_id = p_user_id
  )
$$;

-- Step 2: Update RLS policy for booking_portfolio_attachments INSERT
-- Use SECURITY DEFINER function to avoid RLS blocking when checking file ownership
DROP POLICY IF EXISTS "Booking parties can attach their own portfolio files" 
ON public.booking_portfolio_attachments;

CREATE POLICY "Booking parties can attach their own portfolio files"
ON public.booking_portfolio_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be the one attaching the file
  auth.uid() = attached_by AND
  -- User must be a party in the booking (use existing SECURITY DEFINER function)
  public.is_user_booking_party(booking_id, auth.uid()) AND
  -- Check that user owns the portfolio file (use SECURITY DEFINER function to bypass RLS)
  public.is_portfolio_file_owned_by_user(portfolio_file_id, auth.uid())
);

-- Step 3: Ensure the function exists for booking party check (if not already created)
CREATE OR REPLACE FUNCTION public.is_user_booking_party(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.bookings b
    WHERE b.id = p_booking_id 
    AND (b.sender_id = p_user_id OR b.receiver_id = p_user_id)
  )
$$;