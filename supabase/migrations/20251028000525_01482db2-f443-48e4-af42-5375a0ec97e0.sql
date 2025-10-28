-- Update default values for bands table to include new platforms
ALTER TABLE bands 
ALTER COLUMN social_media_links 
SET DEFAULT '{"tiktok": "", "spotify": "", "website": "", "youtube": "", "facebook": "", "instagram": "", "soundcloud": "", "twitter": "", "appleMusic": "", "bandcamp": ""}'::jsonb;

ALTER TABLE bands 
ALTER COLUMN music_links 
SET DEFAULT '{"spotify": "", "soundcloud": "", "appleMusic": "", "bandcamp": ""}'::jsonb;

-- Update existing bands
UPDATE bands
SET social_media_links = social_media_links || '{"twitter": "", "appleMusic": "", "bandcamp": ""}'::jsonb
WHERE social_media_links IS NOT NULL;

UPDATE bands
SET music_links = music_links || '{"appleMusic": "", "bandcamp": ""}'::jsonb
WHERE music_links IS NOT NULL;