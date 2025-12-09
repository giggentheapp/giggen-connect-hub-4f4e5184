-- Update RLS policy for profile_portfolio to allow booking parties to view files
-- even if they are private, as long as the file is attached to a booking where
-- the user is a party (sender or receiver)

-- Drop the existing policy
DROP POLICY IF EXISTS "authenticated_can_view_public_portfolios" ON public.profile_portfolio;

-- Create updated policy that allows:
-- 1. Users to see their own files (always)
-- 2. Users to see public files (existing behavior)
-- 3. Users to see private files if they are attached to a booking where the user is a party
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
  EXISTS (
    SELECT 1 
    FROM public.booking_portfolio_attachments bpa
    JOIN public.bookings b ON b.id = bpa.booking_id
    WHERE bpa.portfolio_file_id = profile_portfolio.id
    AND (b.sender_id = auth.uid() OR b.receiver_id = auth.uid())
  )
);

-- Create index to improve query performance for the RLS policy check
CREATE INDEX IF NOT EXISTS idx_booking_portfolio_attachments_portfolio_file_id 
ON public.booking_portfolio_attachments(portfolio_file_id);

CREATE INDEX IF NOT EXISTS idx_bookings_sender_receiver 
ON public.bookings(sender_id, receiver_id);