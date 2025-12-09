-- Fix infinite recursion in RLS policies for booking portfolio attachments
-- Use SECURITY DEFINER function to check booking access without triggering RLS

-- Step 1: Create a SECURITY DEFINER function to check if user is a party in a booking
-- This function bypasses RLS to avoid infinite recursion
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

-- Step 2: Create a SECURITY DEFINER function to check if portfolio file is attached to user's booking
-- This function bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_portfolio_file_in_user_booking(
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
    FROM public.booking_portfolio_attachments bpa
    JOIN public.bookings b ON b.id = bpa.booking_id
    WHERE bpa.portfolio_file_id = p_portfolio_file_id
    AND (b.sender_id = p_user_id OR b.receiver_id = p_user_id)
  )
$$;

-- Step 3: Update RLS policy for booking_portfolio_attachments INSERT
-- Remove the requirement for is_public = true and use SECURITY DEFINER function
DROP POLICY IF EXISTS "Booking parties can attach their own portfolio files" 
ON public.booking_portfolio_attachments;

CREATE POLICY "Booking parties can attach their own portfolio files"
ON public.booking_portfolio_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = attached_by AND
  -- Use SECURITY DEFINER function to check booking access without triggering RLS
  public.is_user_booking_party(booking_id, auth.uid()) AND
  -- Check that user owns the portfolio file (without triggering RLS recursion)
  EXISTS (
    SELECT 1 FROM public.profile_portfolio pp
    WHERE pp.id = portfolio_file_id 
    AND pp.user_id = auth.uid()
    -- Removed: AND pp.is_public = true (users can attach private files)
  )
);

-- Step 4: Update RLS policy for profile_portfolio SELECT
-- Use SECURITY DEFINER function to check booking access without triggering RLS
DROP POLICY IF EXISTS "authenticated_can_view_public_portfolios" ON public.profile_portfolio;

CREATE POLICY "authenticated_can_view_public_portfolios" 
ON public.profile_portfolio
FOR SELECT
TO authenticated
USING (
  -- Owner can always see their own files
  auth.uid() = user_id 
  OR 
  -- Public files are visible to all authenticated users
  (is_public = true AND auth.uid() IS NOT NULL)
  OR
  -- Private files are visible if attached to a booking where user is a party
  -- Use SECURITY DEFINER function to avoid RLS recursion
  public.is_portfolio_file_in_user_booking(id, auth.uid())
);

-- Step 5: Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_booking_portfolio_attachments_portfolio_file_id 
ON public.booking_portfolio_attachments(portfolio_file_id);

CREATE INDEX IF NOT EXISTS idx_bookings_sender_receiver 
ON public.bookings(sender_id, receiver_id);