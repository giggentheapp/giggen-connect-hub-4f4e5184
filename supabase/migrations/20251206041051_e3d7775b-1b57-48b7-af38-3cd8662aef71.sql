-- Add ticket_price column to concepts table
ALTER TABLE public.concepts 
ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10,2);