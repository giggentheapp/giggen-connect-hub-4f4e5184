-- Remove all existing storage policies
DROP POLICY IF EXISTS "Users can upload to portfolio bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to concepts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view concept files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own concept files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own concept files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Portfolio bucket - allow makers to upload tech specs
CREATE POLICY "Portfolio upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Portfolio view policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolio');

CREATE POLICY "Portfolio update policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Portfolio delete policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio' AND 
  auth.uid() IS NOT NULL
);