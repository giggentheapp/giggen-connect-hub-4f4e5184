-- Add thumbnail_path column to concept_files table
ALTER TABLE concept_files ADD COLUMN IF NOT EXISTS thumbnail_path text;

-- Add thumbnail_path column to user_files table if it doesn't exist
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS thumbnail_path text;

COMMENT ON COLUMN concept_files.thumbnail_path IS 'Path to thumbnail image for video/audio files';
COMMENT ON COLUMN user_files.thumbnail_path IS 'Path to thumbnail image for video/audio files';