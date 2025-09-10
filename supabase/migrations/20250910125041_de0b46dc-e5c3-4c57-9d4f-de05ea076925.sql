-- Add door deal functionality to bookings table
ALTER TABLE public.bookings 
ADD COLUMN door_deal boolean DEFAULT false,
ADD COLUMN door_percentage numeric CHECK (door_percentage >= 1 AND door_percentage <= 100);