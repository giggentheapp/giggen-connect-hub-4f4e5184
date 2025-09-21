-- Update the approval fields that will make both_parties_approved = true
-- since both_parties_approved is a generated column
UPDATE public.bookings 
SET approved_by_sender = true,
    approved_by_receiver = true,
    approved_at = COALESCE(approved_at, now()),
    sender_approved_at = COALESCE(sender_approved_at, now()),
    receiver_approved_at = COALESCE(receiver_approved_at, now())
WHERE status = 'upcoming'::booking_status 
  AND is_public_after_approval = true 
  AND (approved_by_sender = false OR approved_by_receiver = false);

-- Create a more permissive RLS policy for Goers to view public events
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