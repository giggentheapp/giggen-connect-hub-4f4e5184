-- Fix storage RLS policies for file uploads

-- Create storage policies for portfolio bucket
CREATE POLICY "Users can upload to their own portfolio folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] IN ('portfolio', 'avatar')
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can view their own portfolio files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'portfolio'
  AND (
    -- Own files
    auth.uid()::text = (storage.foldername(name))[2]
    OR
    -- Public portfolio files if settings allow
    (
      (storage.foldername(name))[1] = 'portfolio'
      AND EXISTS (
        SELECT 1 FROM public.profile_settings ps
        WHERE ps.maker_id::text = (storage.foldername(name))[2]
        AND ps.show_portfolio = true
      )
    )
    OR
    -- Public avatars (always visible)
    (storage.foldername(name))[1] = 'avatar'
  )
);

CREATE POLICY "Users can update their own portfolio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own portfolio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create storage policies for concepts bucket
CREATE POLICY "Makers can upload to their own concepts folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'concepts'
  AND (storage.foldername(name))[1] = 'techspec'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Users can view concept files based on settings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'concepts'
  AND (
    -- Own files
    auth.uid()::text = (storage.foldername(name))[2]
    OR
    -- Public concept files if settings allow
    (
      (storage.foldername(name))[1] = 'techspec'
      AND EXISTS (
        SELECT 1 FROM public.profile_settings ps
        WHERE ps.maker_id::text = (storage.foldername(name))[2]
        AND ps.show_techspec = true
      )
    )
  )
);

CREATE POLICY "Makers can update their own concept files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'concepts'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Makers can delete their own concept files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'concepts'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND public.is_maker(auth.uid())
);