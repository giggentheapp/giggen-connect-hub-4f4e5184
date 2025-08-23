-- Create RLS policies for concepts storage bucket
CREATE POLICY "Authenticated users can upload to concepts bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view their own concept files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update their own concept files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete their own concept files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'concepts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also allow public access to concept files for viewing
CREATE POLICY "Public can view concept files" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'concepts');