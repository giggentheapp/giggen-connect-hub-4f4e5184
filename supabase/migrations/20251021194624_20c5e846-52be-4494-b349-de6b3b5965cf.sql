-- Create storage bucket for band images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('band-images', 'band-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for band images
CREATE POLICY "Band images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'band-images');

CREATE POLICY "Band admins can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'band-images' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can update their band images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'band-images' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can delete their band images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-images' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );