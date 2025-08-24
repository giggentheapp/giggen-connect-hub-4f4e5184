-- Fix storage RLS policies for portfolio bucket
-- Delete existing problematic policies first
DROP POLICY IF EXISTS "Allow authenticated users to upload portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their own portfolio files" ON storage.objects;

-- Create comprehensive storage policies for portfolio bucket
CREATE POLICY "Users can upload to portfolio bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view portfolio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'portfolio' AND 
  (
    auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text
    OR 
    true -- Portfolio files are public
  )
);

CREATE POLICY "Users can update their own portfolio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own portfolio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Also ensure concepts bucket has proper policies
DROP POLICY IF EXISTS "Authenticated users can upload concept files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view concept files" ON storage.objects;

CREATE POLICY "Users can upload to concepts bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view concept files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'concepts' AND 
  (
    auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text
    OR 
    true -- Concept files are public
  )
);

CREATE POLICY "Users can update their own concept files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own concept files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatar bucket policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);