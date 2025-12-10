-- Add receiver_contact_info column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS receiver_contact_info JSONB;