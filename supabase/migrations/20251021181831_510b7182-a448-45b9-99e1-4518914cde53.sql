-- Ensure the update_booking_status policy properly allows completed status
-- Drop the old policy and recreate it with explicit permissions
DROP POLICY IF EXISTS "update_booking_status" ON bookings;

CREATE POLICY "update_booking_status"
ON bookings
FOR UPDATE
USING (
  (auth.uid() = sender_id) OR (auth.uid() = receiver_id)
)
WITH CHECK (
  ((auth.uid() = sender_id) OR (auth.uid() = receiver_id))
  AND (status IN ('pending', 'allowed', 'approved_by_sender', 'approved_by_receiver', 'approved_by_both', 'upcoming', 'completed', 'cancelled'))
);