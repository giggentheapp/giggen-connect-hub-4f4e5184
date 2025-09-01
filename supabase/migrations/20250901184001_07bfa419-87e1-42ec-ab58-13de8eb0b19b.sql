-- Add DELETE policy for bookings table
-- This allows both sender and receiver to delete bookings
CREATE POLICY "Involved users can delete bookings" 
ON public.bookings 
FOR DELETE 
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));