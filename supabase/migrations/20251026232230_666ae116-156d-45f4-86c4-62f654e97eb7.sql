-- Fix security warning: Add search_path to migrate function
DROP FUNCTION IF EXISTS public.migrate_file_to_filbank(text, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.migrate_file_to_filbank(
  old_bucket text,
  old_path text,
  user_id uuid,
  file_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
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
  
  -- Update user_files record with new path
  UPDATE user_files
  SET 
    file_path = new_path,
    bucket_name = 'filbank',
    updated_at = now()
  WHERE id = file_id;
  
  RETURN true;
END;
$$;