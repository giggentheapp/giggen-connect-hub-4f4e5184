-- Add public_visibility_settings column to concepts table
ALTER TABLE public.concepts
ADD COLUMN public_visibility_settings jsonb DEFAULT '{}'::jsonb;