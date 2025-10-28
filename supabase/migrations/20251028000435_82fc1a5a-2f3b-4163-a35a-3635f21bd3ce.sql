-- Update the default value for social_media_links to include new platforms
ALTER TABLE profiles 
ALTER COLUMN social_media_links 
SET DEFAULT '{"tiktok": "", "spotify": "", "website": "", "youtube": "", "facebook": "", "instagram": "", "soundcloud": "", "twitter": "", "appleMusic": "", "bandcamp": ""}'::jsonb;