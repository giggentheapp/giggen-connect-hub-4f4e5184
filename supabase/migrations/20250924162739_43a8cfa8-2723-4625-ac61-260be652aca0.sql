-- Create missing storage buckets for hospitality riders and tech specs
INSERT INTO storage.buckets (id, name, public) VALUES 
('hospitality', 'hospitality', false),
('tech-specs', 'tech-specs', false);

-- Create RLS policies for hospitality bucket
CREATE POLICY "Users can upload hospitality files" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'hospitality' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view hospitality files" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'hospitality' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update hospitality files" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'hospitality' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete hospitality files" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'hospitality' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for tech-specs bucket
CREATE POLICY "Users can upload tech spec files" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'tech-specs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view tech spec files" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'tech-specs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update tech spec files" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'tech-specs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete tech spec files" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'tech-specs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);