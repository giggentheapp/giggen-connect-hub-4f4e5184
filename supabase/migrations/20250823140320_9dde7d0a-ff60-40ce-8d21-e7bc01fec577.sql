-- Drop existing problematic policies and recreate them properly
DROP POLICY IF EXISTS "Authenticated users can upload to concepts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their own concept files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own concept files" ON storage.objects;  
DROP POLICY IF EXISTS "Authenticated users can delete their own concept files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view concept files" ON storage.objects;

-- Create proper storage policies for concepts bucket
CREATE POLICY "Users can upload to concepts bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view concept files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'concepts');

CREATE POLICY "Public can view concept files" 
ON storage.objects 
FOR SELECT 
TO anon
USING (bucket_id = 'concepts');

CREATE POLICY "Users can update their concept files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their concept files" 
ON storage.objects 
FOR DELETE 
TO authenticated  
USING (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);