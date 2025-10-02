-- Add new date and time columns to bookings table to support date ranges and time slots

-- Add end_date column for events that span multiple days
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Add start_time and end_time columns for more precise scheduling
-- Note: The existing 'time' column is kept for backwards compatibility
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS start_time text;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS end_time text;

-- Add comment to clarify the purpose of these columns
COMMENT ON COLUMN public.bookings.end_date IS 'End date for multi-day events';
COMMENT ON COLUMN public.bookings.start_time IS 'Start time in HH:MM format';
COMMENT ON COLUMN public.bookings.end_time IS 'End time in HH:MM format';

-- Migrate existing 'time' data to 'start_time' for consistency
UPDATE public.bookings 
SET start_time = time 
WHERE start_time IS NULL AND time IS NOT NULL;