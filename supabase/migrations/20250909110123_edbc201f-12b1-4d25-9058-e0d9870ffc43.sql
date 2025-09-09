-- Add tech_spec field to bookings table if it doesn't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tech_spec TEXT;

-- Update the update_booking_updated_at trigger to work with the new field
-- (No changes needed as it uses NEW.*)

-- Ensure RLS policies allow access to tech_spec and hospitality_rider for booking parties
-- (The existing policies should cover this as they allow booking parties to view their bookings)