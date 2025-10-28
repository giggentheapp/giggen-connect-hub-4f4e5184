-- Add thumbnail support for audio files in user_files table
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS thumbnail_path text;
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS thumbnail_url text;

COMMENT ON COLUMN user_files.thumbnail_path IS 'Storage path to thumbnail image for audio files';
COMMENT ON COLUMN user_files.thumbnail_url IS 'Public URL to thumbnail image for audio files';