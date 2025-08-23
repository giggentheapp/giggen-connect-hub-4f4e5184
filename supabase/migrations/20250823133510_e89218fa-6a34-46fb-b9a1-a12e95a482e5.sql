-- Add additional fields to concepts table for comprehensive concept creation
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS expected_audience INTEGER;
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS tech_spec TEXT;
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS available_dates JSONB;
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;