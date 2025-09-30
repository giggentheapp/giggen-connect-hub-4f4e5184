
-- Drop the old policy that uses both_parties_approved
DROP POLICY IF EXISTS "public_can_view_basic_upcoming_events" ON bookings;

-- Create new policy that checks approved_by_sender and approved_by_receiver directly
CREATE POLICY "public_can_view_basic_upcoming_events" 
ON bookings 
FOR SELECT 
USING (
  (status = 'upcoming'::booking_status) 
  AND (is_public_after_approval = true) 
  AND (approved_by_sender = true)
  AND (approved_by_receiver = true)
  AND (auth.uid() IS NOT NULL) 
  AND (auth.uid() <> sender_id) 
  AND (auth.uid() <> receiver_id)
);

-- Also update the venue to "HEY JO" 
UPDATE bookings 
SET venue = 'HEY JO'
WHERE title = 'Soulful Strings' AND venue = 'Ved avtale';
