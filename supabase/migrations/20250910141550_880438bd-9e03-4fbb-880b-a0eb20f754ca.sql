-- Add flexible pricing options to concepts table
ALTER TABLE public.concepts ADD COLUMN door_deal boolean DEFAULT false;
ALTER TABLE public.concepts ADD COLUMN door_percentage numeric DEFAULT NULL;

-- Add a column to indicate "by agreement" pricing
ALTER TABLE public.concepts ADD COLUMN price_by_agreement boolean DEFAULT false;