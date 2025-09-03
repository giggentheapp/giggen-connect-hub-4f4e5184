-- Fix booking status constraint to include 'pending' status
ALTER TABLE public.bookings 
DROP CONSTRAINT bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'negotiating'::text, 'confirming'::text, 'confirmed'::text, 'published'::text, 'cancelled'::text, 'rejected'::text])));

-- Fix foreign keys to reference profiles.user_id instead of auth.users.id for consistency
-- First, drop existing foreign keys
ALTER TABLE public.bookings DROP CONSTRAINT bookings_sender_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT bookings_receiver_id_fkey;

-- Add new foreign keys referencing profiles.user_id
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update RLS policies to be more specific about maker-only booking access
-- Keep existing policies but add comments for clarity
COMMENT ON POLICY "Only makers can create bookings as sender" ON public.bookings IS 
'Only users with maker role can create bookings and must be the sender';

COMMENT ON POLICY "Only makers involved in booking can view" ON public.bookings IS 
'Only makers who are sender or receiver can view booking details';

COMMENT ON POLICY "Only involved makers can update bookings" ON public.bookings IS 
'Only makers involved in the booking can update it';

COMMENT ON POLICY "Only involved makers can delete bookings" ON public.bookings IS 
'Only makers involved in the booking can delete it';

-- Ensure booking_changes table also follows same pattern
ALTER TABLE public.booking_changes 
DROP CONSTRAINT IF EXISTS booking_changes_changed_by_fkey;

ALTER TABLE public.booking_changes 
ADD CONSTRAINT booking_changes_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;