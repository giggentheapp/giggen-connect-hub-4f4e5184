
-- Fix remaining security definer functions to have proper search_path

-- Fix accept_band_invite
CREATE OR REPLACE FUNCTION public.accept_band_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update invite status
  UPDATE band_invites
  SET status = 'accepted',
      responded_at = now()
  WHERE id = invite_id
    AND invited_user_id = auth.uid()
    AND status = 'pending';

  -- Add user to band_members
  INSERT INTO band_members (band_id, user_id, role)
  SELECT band_id, invited_user_id, 'member'
  FROM band_invites
  WHERE id = invite_id
    AND invited_user_id = auth.uid();
END;
$$;

-- Fix add_band_founder (trigger function)
CREATE OR REPLACE FUNCTION public.add_band_founder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO band_members (band_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'founder');
  RETURN NEW;
END;
$$;

-- Fix handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    username, 
    display_name,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'musician'::user_role)
  );
  RETURN NEW;
END;
$$;

-- Fix migrate_file_to_filbank
CREATE OR REPLACE FUNCTION public.migrate_file_to_filbank(
  old_bucket text,
  old_path text,
  user_id uuid,
  file_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_path text;
BEGIN
  -- Generate new path in filbank
  new_path := user_id::text || '/' || substring(old_path from '[^/]+/(.*)$');
  
  -- Update the file record
  UPDATE user_files
  SET 
    bucket_name = 'filbank',
    file_path = new_path,
    file_url = 'https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/' || new_path
  WHERE id = file_id;
  
  RETURN true;
END;
$$;
