-- Update existing profiles to include new social media platforms
UPDATE profiles
SET social_media_links = social_media_links || 
  '{"twitter": "", "appleMusic": "", "bandcamp": ""}'::jsonb
WHERE social_media_links IS NOT NULL;