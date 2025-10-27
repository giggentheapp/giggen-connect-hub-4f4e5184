-- Allow public viewing of files in profile portfolios
-- This enables audio/video/image files to play when viewing someone's public profile

CREATE POLICY "Public can view profile portfolio files in filbank"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'filbank' 
  AND EXISTS (
    SELECT 1 FROM file_usage fu
    JOIN user_files uf ON uf.id = fu.file_id
    WHERE uf.file_path = storage.objects.name
    AND fu.usage_type = 'profile_portfolio'
  )
);