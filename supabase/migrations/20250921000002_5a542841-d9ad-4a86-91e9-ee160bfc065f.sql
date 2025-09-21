-- Fix the existing published events to have both_parties_approved = true
-- since they are already in 'upcoming' status and marked as public
UPDATE public.bookings 
SET both_parties_approved = true,
    approved_by_sender = true,
    approved_by_receiver = true,
    approved_at = COALESCE(approved_at, now())
WHERE status = 'upcoming'::booking_status 
  AND is_public_after_approval = true 
  AND both_parties_approved = false;

-- Also create a more permissive RLS policy for Goers to view public events
-- This allows Goers to see published events even if both_parties_approved workflow is not complete
CREATE POLICY "goers_can_view_published_events" ON public.bookings
FOR SELECT 
TO authenticated
USING (
  -- Allow Goers to see published events that are marked as public
  status = 'upcoming'::booking_status 
  AND is_public_after_approval = true
  AND auth.uid() IS NOT NULL
  -- Don't show to the parties involved (they have their own policies)
  AND auth.uid() != sender_id 
  AND auth.uid() != receiver_id
);