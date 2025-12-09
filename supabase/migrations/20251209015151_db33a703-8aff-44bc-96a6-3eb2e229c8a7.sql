-- Fix RLS policy for booking_portfolio_attachments
-- Allow users to attach their own portfolio files regardless of is_public status
-- This fixes the issue where users cannot attach files from filbanken when editing bookings

-- Drop the existing policy
DROP POLICY IF EXISTS "Booking parties can attach their own portfolio files" 
ON public.booking_portfolio_attachments;

-- Create updated policy that allows users to attach their own files
-- regardless of whether they are public or private
CREATE POLICY "Booking parties can attach their own portfolio files"
ON public.booking_portfolio_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be the one attaching the file
  auth.uid() = attached_by AND
  -- User must be a party in the booking (sender or receiver)
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id 
    AND (b.sender_id = auth.uid() OR b.receiver_id = auth.uid())
  ) AND
  -- User must own the portfolio file
  -- Removed requirement for is_public = true since users should be able
  -- to attach their own files regardless of public/private status
  EXISTS (
    SELECT 1 FROM public.profile_portfolio pp
    WHERE pp.id = portfolio_file_id 
    AND pp.user_id = auth.uid()
  )
);