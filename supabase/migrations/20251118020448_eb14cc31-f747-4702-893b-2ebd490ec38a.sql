-- Improved user deletion function that ensures ALL storage files are deleted
CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid uuid, requesting_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  storage_file RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Security check: User can only delete their own account
  IF user_uuid != requesting_user_id THEN
    RAISE EXCEPTION 'Du kan bare slette din egen konto. User UUID: %, Requesting User ID: %', user_uuid, requesting_user_id;
  END IF;
  
  RAISE NOTICE 'Starting deletion for user: %', user_uuid;
  
  -- DELETE ALL STORAGE FILES FIRST
  -- This is critical - we delete from storage.objects directly
  
  -- 1. Delete all files from filbank bucket for this user
  FOR storage_file IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'filbank' 
    AND (name LIKE user_uuid::text || '/%' OR name LIKE '%/' || user_uuid::text || '/%')
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'filbank' AND name = storage_file.name;
    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Deleted storage file: filbank/%', storage_file.name;
  END LOOP;
  
  -- 2. Delete avatar if exists
  FOR storage_file IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'avatars' 
    AND name LIKE '%' || user_uuid::text || '%'
  LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = storage_file.name;
    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Deleted avatar: %', storage_file.name;
  END LOOP;
  
  RAISE NOTICE 'Deleted % storage files', deleted_count;
  
  -- NOW DELETE DATABASE RECORDS (in proper order to avoid FK violations)
  
  -- Delete band invites
  DELETE FROM band_invites 
  WHERE invited_user_id = user_uuid OR invited_by = user_uuid;
  
  -- Delete file usage tracking
  DELETE FROM file_usage 
  WHERE file_id IN (SELECT id FROM user_files WHERE user_id = user_uuid);
  
  -- Delete band files
  DELETE FROM band_portfolio WHERE band_id IN (SELECT id FROM bands WHERE created_by = user_uuid);
  DELETE FROM band_tech_specs WHERE band_id IN (SELECT id FROM bands WHERE created_by = user_uuid);
  DELETE FROM band_hospitality WHERE band_id IN (SELECT id FROM bands WHERE created_by = user_uuid);
  
  -- Delete band memberships
  DELETE FROM band_members WHERE user_id = user_uuid;
  
  -- Delete bands
  DELETE FROM bands WHERE created_by = user_uuid;
  
  -- Delete user files records
  DELETE FROM user_files WHERE user_id = user_uuid;
  
  -- Delete booking attachments
  DELETE FROM booking_portfolio_attachments WHERE attached_by = user_uuid;
  
  -- Delete booking changes
  DELETE FROM booking_changes 
  WHERE booking_id IN (SELECT id FROM bookings WHERE sender_id = user_uuid OR receiver_id = user_uuid);
  
  -- Delete bookings
  DELETE FROM bookings WHERE sender_id = user_uuid OR receiver_id = user_uuid;
  
  -- Delete concept files
  DELETE FROM concept_files WHERE creator_id = user_uuid;
  
  -- Delete concepts history
  DELETE FROM concepts_history WHERE maker_id = user_uuid;
  
  -- Delete concepts
  DELETE FROM concepts WHERE maker_id = user_uuid;
  
  -- Delete transactions BEFORE tickets
  DELETE FROM transactions WHERE user_id = user_uuid;
  
  -- Delete tickets
  DELETE FROM tickets WHERE user_id = user_uuid;
  
  -- Delete events
  DELETE FROM events_market WHERE created_by = user_uuid;
  
  -- Delete hospitality riders
  DELETE FROM hospitality_riders WHERE user_id = user_uuid;
  
  -- Delete profile portfolio
  DELETE FROM profile_portfolio WHERE user_id = user_uuid;
  
  -- Delete profile tech specs
  DELETE FROM profile_tech_specs WHERE profile_id = user_uuid;
  
  -- Delete profile settings
  DELETE FROM profile_settings WHERE maker_id = user_uuid;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = user_uuid;
  
  -- Delete audit logs
  DELETE FROM audit_logs WHERE user_id = user_uuid;
  
  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = user_uuid;
  
  -- Delete profile
  DELETE FROM profiles WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Successfully deleted all data and % storage files for user %', deleted_count, user_uuid;
END;
$$;

-- Ensure the auth user deletion trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deletion();

-- Make sure the trigger function exists and calls delete_user_data properly
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up all user data before the auth user is deleted
  -- Pass the user_id twice since the trigger is executing as the user being deleted
  RAISE NOTICE 'Trigger fired: Deleting all data for user %', OLD.id;
  PERFORM public.delete_user_data(OLD.id, OLD.id);
  RETURN OLD;
END;
$$;