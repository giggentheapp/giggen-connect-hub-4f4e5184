-- Add by_agreement field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN by_agreement boolean DEFAULT false;