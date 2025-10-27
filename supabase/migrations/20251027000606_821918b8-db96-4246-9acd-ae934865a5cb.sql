-- Add is_public column to user_files
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Update RLS policy to allow viewing public files
DROP POLICY IF EXISTS "Users can view their own files" ON user_files;

CREATE POLICY "Users can view their own files or public files"
ON user_files FOR SELECT
USING (
  auth.uid() = user_id OR 
  (is_public = true AND auth.uid() IS NOT NULL)
);