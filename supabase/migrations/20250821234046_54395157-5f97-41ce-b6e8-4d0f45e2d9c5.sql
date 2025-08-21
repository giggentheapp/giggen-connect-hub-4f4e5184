-- Drop existing storage policies
DROP POLICY IF EXISTS "Makers can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Makers can upload portfolio files" ON storage.objects;  
DROP POLICY IF EXISTS "Makers can upload concept files" ON storage.objects;
DROP POLICY IF EXISTS "Makers can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Makers can update their portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Makers can update their concept files" ON storage.objects;
DROP POLICY IF EXISTS "Makers can delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Makers can delete their portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Makers can delete their concept files" ON storage.objects;

-- Create corrected storage policies with [1] index
CREATE POLICY "Makers can upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can upload portfolio files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can upload concept files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'concepts' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can update their avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can update their portfolio files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can update their concept files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'concepts' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can delete their avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can delete their portfolio files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));

CREATE POLICY "Makers can delete their concept files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'concepts' AND (auth.uid())::text = (storage.foldername(name))[1] AND is_maker(auth.uid()));