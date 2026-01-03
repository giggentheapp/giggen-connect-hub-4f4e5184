-- Add thumbnail_path column to profile_portfolio table if it doesn't exist
ALTER TABLE profile_portfolio ADD COLUMN IF NOT EXISTS thumbnail_path text;

COMMENT ON COLUMN profile_portfolio.thumbnail_path IS 'Path to thumbnail image for video/audio files';