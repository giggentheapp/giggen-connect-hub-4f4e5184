-- Add signature fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS sender_signature TEXT,
ADD COLUMN IF NOT EXISTS sender_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receiver_signature TEXT,
ADD COLUMN IF NOT EXISTS receiver_signed_at TIMESTAMP WITH TIME ZONE;