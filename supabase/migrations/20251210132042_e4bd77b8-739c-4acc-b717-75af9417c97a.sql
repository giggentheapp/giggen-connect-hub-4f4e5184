-- Add background images fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dashboard_background_images text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS randomize_backgrounds boolean DEFAULT false;