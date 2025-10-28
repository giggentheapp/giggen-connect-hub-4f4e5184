-- Update RLS policy on user_files to allow viewing portfolio files
DROP POLICY IF EXISTS "Users can view their own files or public files" ON user_files;

CREATE POLICY "Users can view their own files or public files"
ON user_files
FOR SELECT
USING (
  -- Users can see their own files
  auth.uid() = user_id
  OR
  -- Users can see public files
  (is_public = true AND auth.uid() IS NOT NULL)
  OR
  -- Users can see files that are used in profile portfolios
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM file_usage
      WHERE file_usage.file_id = user_files.id
      AND file_usage.usage_type = 'profile_portfolio'
    )
  )
);