-- Allow authenticated users to view profile portfolio files
CREATE POLICY "Authenticated users can view profile portfolio files in filbank"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'filbank' 
  AND (
    -- Own files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Profile portfolio files from any user
    EXISTS (
      SELECT 1 FROM file_usage fu
      JOIN user_files uf ON uf.id = fu.file_id
      WHERE uf.file_path = storage.objects.name
      AND fu.usage_type = 'profile_portfolio'
    )
    OR
    -- Files explicitly marked as public
    EXISTS (
      SELECT 1 FROM user_files uf
      WHERE uf.file_path = storage.objects.name
      AND uf.is_public = true
    )
  )
);