-- Update RLS policy to not require is_public for own files
DROP POLICY IF EXISTS "Users can view file usage" ON file_usage;

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
  -- Other users can see profile portfolio usage (RLS on user_files controls visibility)
  (
    auth.uid() IS NOT NULL
    AND file_usage.usage_type = 'profile_portfolio'
  )
);