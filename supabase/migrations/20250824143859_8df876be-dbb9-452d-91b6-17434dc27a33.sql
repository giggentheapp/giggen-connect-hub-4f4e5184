-- Add policies for concepts and avatars buckets
CREATE POLICY "Concepts upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Concepts view policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'concepts');

CREATE POLICY "Concepts update policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Concepts delete policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'concepts' AND 
  auth.uid() IS NOT NULL
);

-- Avatars bucket policies
CREATE POLICY "Avatars upload policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Avatars view policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars update policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Avatars delete policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL
);