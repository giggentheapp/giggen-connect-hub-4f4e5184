-- Drop the old policy
DROP POLICY IF EXISTS "Public can view profile portfolio files in filbank" ON storage.objects;

-- Create improved policy that allows public viewing of:
-- 1. Files marked as profile portfolio
-- 2. Files explicitly marked as public
CREATE POLICY "Public can view public files in filbank"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'filbank' 
  AND (
    -- Allow files marked as public
    EXISTS (
      SELECT 1 FROM user_files uf
      WHERE uf.file_path = storage.objects.name
      AND uf.is_public = true
    )
    OR
    -- Allow profile portfolio files
    EXISTS (
      SELECT 1 FROM file_usage fu
      JOIN user_files uf ON uf.id = fu.file_id
      WHERE uf.file_path = storage.objects.name
      AND fu.usage_type = 'profile_portfolio'
    )
  )
);