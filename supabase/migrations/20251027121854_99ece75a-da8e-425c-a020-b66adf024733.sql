-- Ensure storage policies allow avatar uploads to filbank bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Allow users to upload to their own avatar folder
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'filbank' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'filbank' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'filbank' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Make avatars publicly viewable
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'filbank'
  AND (storage.foldername(name))[2] = 'avatars'
);