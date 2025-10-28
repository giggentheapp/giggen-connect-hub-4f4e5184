-- Fix RLS policy to allow users to see their own portfolio regardless of public status
DROP POLICY IF EXISTS "Users can view file usage" ON file_usage;

CREATE POLICY "Users can view file usage"
ON file_usage
FOR SELECT
USING (
  -- Users can ALWAYS see their own file usage (regardless of public status)
  EXISTS (
    SELECT 1 FROM user_files
    WHERE user_files.id = file_usage.file_id
    AND user_files.user_id = auth.uid()
  )
  OR
  -- Other authenticated users can see public portfolio files
  (
    auth.uid() IS NOT NULL
    AND file_usage.usage_type = 'profile_portfolio'
    AND EXISTS (
      SELECT 1 FROM user_files
      WHERE user_files.id = file_usage.file_id
      AND user_files.is_public = true
    )
  )
);