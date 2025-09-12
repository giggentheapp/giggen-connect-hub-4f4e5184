-- First, add new enum values to booking_status
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_sender';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_receiver';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved_by_both';

-- Add new publishing fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS published_by_sender boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_by_receiver boolean DEFAULT false;