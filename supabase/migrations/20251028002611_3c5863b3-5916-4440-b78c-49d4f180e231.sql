-- Update delete_user_data function to ensure ALL files are deleted from storage
CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid uuid, requesting_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Security check: User can only delete their own account
  IF user_uuid != requesting_user_id THEN
    RAISE EXCEPTION 'Du kan bare slette din egen konto. User UUID: %, Requesting User ID: %', user_uuid, requesting_user_id;
  END IF;
  
  -- Delete ALL storage files first (before database records)
  
  -- User's filbank files (all user files in one bucket)
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank' 
  AND name IN (SELECT file_path FROM user_files WHERE user_id = user_uuid);
  
  -- Band files for bands where user is founder/admin
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank'
  AND name IN (
    SELECT bp.file_path FROM band_portfolio bp
    INNER JOIN bands b ON bp.band_id = b.id
    WHERE b.created_by = user_uuid
  );
  
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank'
  AND name IN (
    SELECT bts.file_path FROM band_tech_specs bts
    INNER JOIN bands b ON bts.band_id = b.id
    WHERE b.created_by = user_uuid
  );
  
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank'
  AND name IN (
    SELECT bh.file_path FROM band_hospitality bh
    INNER JOIN bands b ON bh.band_id = b.id
    WHERE b.created_by = user_uuid
  );
  
  -- Band logos and banners
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank'
  AND name IN (
    SELECT REGEXP_REPLACE(image_url, '^.*/filbank/', '') 
    FROM bands 
    WHERE created_by = user_uuid AND image_url IS NOT NULL
  );
  
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank'
  AND name IN (
    SELECT REGEXP_REPLACE(banner_url, '^.*/filbank/', '') 
    FROM bands 
    WHERE created_by = user_uuid AND banner_url IS NOT NULL
  );
  
  -- Profile portfolio files
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank' 
  AND name IN (SELECT file_path FROM profile_portfolio WHERE user_id = user_uuid);
  
  -- Profile tech specs
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank' 
  AND name IN (SELECT file_path FROM profile_tech_specs WHERE profile_id = user_uuid);
  
  -- Hospitality riders
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank' 
  AND name IN (SELECT file_path FROM hospitality_riders WHERE user_id = user_uuid);
  
  -- Concept files
  DELETE FROM storage.objects
  WHERE bucket_id = 'filbank' 
  AND name IN (SELECT file_path FROM concept_files WHERE creator_id = user_uuid);
  
  -- Avatar (if exists in avatars bucket)
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars' 
  AND name IN (
    SELECT REGEXP_REPLACE(avatar_url, '^.*/avatars/', '') 
    FROM profiles 
    WHERE user_id = user_uuid AND avatar_url IS NOT NULL
  );
  
  -- Now delete database records (in proper order to avoid FK violations)
  
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
  
  -- Delete user files
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
  
  RAISE NOTICE 'Successfully deleted all data and storage files for user %', user_uuid;
END;
$function$;