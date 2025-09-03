-- Add contact info sharing field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN sender_contact_info jsonb;

-- Add realtime support for bookings table
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.bookings;