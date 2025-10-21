-- Fix the RLS policy to allow updating to completed status
DROP POLICY IF EXISTS "update_booking_status" ON public.bookings;

CREATE POLICY "update_booking_status" ON public.bookings
FOR UPDATE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
)
WITH CHECK (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
);