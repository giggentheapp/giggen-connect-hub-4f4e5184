-- Remove existing folder-based policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload hospitality files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view hospitality files" ON storage.objects;  
DROP POLICY IF EXISTS "Users can update hospitality files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete hospitality files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload tech spec files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view tech spec files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update tech spec files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete tech spec files" ON storage.objects;

-- Create simple, working policies for all authenticated users
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE 
TO authenticated 
USING (true);