-- Add social media links column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{
  "instagram": "",
  "facebook": "", 
  "youtube": "",
  "spotify": "",
  "soundcloud": "",
  "tiktok": "",
  "website": ""
}';