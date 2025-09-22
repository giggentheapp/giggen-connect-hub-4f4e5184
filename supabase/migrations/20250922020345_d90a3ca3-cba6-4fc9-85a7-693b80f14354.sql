-- Add coordinates fields to bookings table for map functionality
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add comments to explain the coordinate fields
COMMENT ON COLUMN public.bookings.latitude IS 'Latitude coordinate for venue location (for map display)';
COMMENT ON COLUMN public.bookings.longitude IS 'Longitude coordinate for venue location (for map display)';