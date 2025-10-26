-- Create new unified filbank bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('filbank', 'filbank', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for filbank bucket
-- Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder in filbank"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'filbank' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own files
CREATE POLICY "Users can view own files in filbank"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'filbank' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update own files in filbank"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'filbank' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files in filbank"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'filbank' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Update user_files table to use new bucket structure
-- Add bucket_name column if it doesn't exist
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS bucket_name text DEFAULT 'filbank';

-- Update file_path format to include user_id folder structure
-- This will be handled in the application code during migration

-- Create function to help migrate files
CREATE OR REPLACE FUNCTION public.migrate_file_to_filbank(
  old_bucket text,
  old_path text,
  user_id uuid,
  file_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_path text;
  file_exists boolean;
BEGIN
  -- Generate new path: user_id/category/filename
  new_path := user_id::text || '/' || old_path;
  
  -- Check if file exists in old bucket
  SELECT EXISTS(
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = old_bucket AND name = old_path
  ) INTO file_exists;
  
  IF NOT file_exists THEN
    RETURN false;
  END IF;
  
  -- Copy file to new location (this needs to be done via storage API)
  -- Update user_files record
  UPDATE user_files
  SET 
    file_path = new_path,
    bucket_name = 'filbank',
    updated_at = now()
  WHERE id = file_id;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.migrate_file_to_filbank IS 'Helper function to migrate files from old buckets to filbank';