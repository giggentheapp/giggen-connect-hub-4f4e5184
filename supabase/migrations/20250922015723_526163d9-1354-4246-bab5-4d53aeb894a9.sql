-- Add address field to bookings table for separate venue and address handling
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment to explain the difference between venue and address
COMMENT ON COLUMN public.bookings.venue IS 'Name of the venue/location (e.g. "Oslo Konserthus")';
COMMENT ON COLUMN public.bookings.address IS 'Physical address of the venue (e.g. "Munkedamsveien 14, 0161 Oslo")';