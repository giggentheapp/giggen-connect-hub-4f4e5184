-- Add address and coordinates to profiles table
ALTER TABLE public.profiles 
ADD COLUMN address text,
ADD COLUMN latitude numeric(10,8),
ADD COLUMN longitude numeric(11,8);

-- Add show_on_map toggle to profile_settings
ALTER TABLE public.profile_settings 
ADD COLUMN show_on_map boolean NOT NULL DEFAULT false;

-- Add index for efficient geo queries
CREATE INDEX idx_profiles_coordinates ON public.profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;