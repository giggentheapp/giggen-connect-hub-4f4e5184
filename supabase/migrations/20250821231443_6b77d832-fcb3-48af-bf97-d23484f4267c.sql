-- Fix storage RLS policies to match actual folder structure

-- Drop existing INSERT policies that have wrong folder structure expectations
DROP POLICY IF EXISTS "Only makers can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own portfolio folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own concept folders" ON storage.objects;

-- Drop existing UPDATE/DELETE policies that have wrong folder structure expectations
DROP POLICY IF EXISTS "Only makers can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Only makers can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own concept files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own concept files" ON storage.objects;

-- Create new correct policies for avatars bucket
-- File structure: {userId}/{filename}
CREATE POLICY "Makers can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can update their avatars" ON storage.objects  
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1] 
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can delete their avatars" ON storage.objects
FOR DELETE TO authenticated  
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

-- Create new correct policies for portfolio bucket  
-- File structure: {userId}/{filename}
CREATE POLICY "Makers can upload portfolio files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can update their portfolio files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'portfolio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can delete their portfolio files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'portfolio'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

-- Create new correct policies for concepts bucket
-- File structure: {userId}/{filename}  
CREATE POLICY "Makers can upload concept files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'concepts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can update their concept files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'concepts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);

CREATE POLICY "Makers can delete their concept files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'concepts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND is_maker(auth.uid())
);