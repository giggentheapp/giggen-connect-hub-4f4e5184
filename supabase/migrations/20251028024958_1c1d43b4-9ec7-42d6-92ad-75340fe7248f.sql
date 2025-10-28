-- Update RLS policy for file_usage to allow viewing public portfolio files
DROP POLICY IF EXISTS "Users can view their file usage" ON file_usage;

CREATE POLICY "Users can view file usage"
ON file_usage
FOR SELECT
USING (
  -- Users can see their own file usage
  EXISTS (
    SELECT 1 FROM user_files
    WHERE user_files.id = file_usage.file_id
    AND user_files.user_id = auth.uid()
  )
  OR
  -- Anyone can see file usage for public portfolio files
  (
    file_usage.usage_type = 'profile_portfolio'
    AND EXISTS (
      SELECT 1 FROM user_files
      WHERE user_files.id = file_usage.file_id
      AND user_files.is_public = true
    )
  )
);