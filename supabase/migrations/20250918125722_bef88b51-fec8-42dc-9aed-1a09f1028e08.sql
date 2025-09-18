-- Add Mapbox configuration fields to profile_settings table
ALTER TABLE public.profile_settings 
ADD COLUMN mapbox_access_token TEXT,
ADD COLUMN mapbox_style_url TEXT DEFAULT 'mapbox://styles/mapbox/light-v11';

-- Add some helpful comments
COMMENT ON COLUMN public.profile_settings.mapbox_access_token IS 'User''s Mapbox access token for authentication';
COMMENT ON COLUMN public.profile_settings.mapbox_style_url IS 'Custom Mapbox style URL for map styling';