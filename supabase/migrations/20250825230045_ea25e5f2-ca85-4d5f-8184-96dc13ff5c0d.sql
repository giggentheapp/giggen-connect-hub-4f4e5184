-- Add foreign key constraints for bookings table to link to profiles
-- sender_id and receiver_id should reference profiles.user_id since that's what identifies users in the system

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_sender_id ON public.bookings(sender_id);
CREATE INDEX IF NOT EXISTS idx_bookings_receiver_id ON public.bookings(receiver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings(status, event_date) WHERE event_date IS NOT NULL;