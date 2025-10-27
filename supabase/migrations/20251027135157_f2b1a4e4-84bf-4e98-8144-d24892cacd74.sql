-- Fix: Accept requesting_user_id parameter and verify user can only delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_data(
  user_uuid uuid,
  requesting_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check: User can only delete their own account
  IF user_uuid != requesting_user_id THEN
    RAISE EXCEPTION 'Du kan bare slette din egen konto. User UUID: %, Requesting User ID: %', user_uuid, requesting_user_id;
  END IF;
  
  -- Delete band-related data first
  -- Delete band invites sent by or to the user
  DELETE FROM band_invites 
  WHERE invited_user_id = user_uuid OR invited_by = user_uuid;
  
  -- Delete band memberships
  DELETE FROM band_members 
  WHERE user_id = user_uuid;
  
  -- Delete bands created by user (if they're the founder, delete the entire band)
  DELETE FROM bands 
  WHERE created_by = user_uuid;
  
  -- Delete all files from storage buckets
  -- Portfolio files
  PERFORM storage.delete_object('portfolio', file_path)
  FROM profile_portfolio WHERE user_id = user_uuid;
  
  -- Tech specs
  PERFORM storage.delete_object('tech-specs', file_path)
  FROM profile_tech_specs WHERE profile_id = user_uuid;
  
  -- Hospitality riders
  PERFORM storage.delete_object('hospitality', file_path)
  FROM hospitality_riders WHERE user_id = user_uuid;
  
  -- Concept files
  PERFORM storage.delete_object('concepts', file_path)
  FROM concept_files WHERE creator_id = user_uuid;
  
  -- User files (filbank)
  PERFORM storage.delete_object('filbank', file_path)
  FROM user_files WHERE user_id = user_uuid;
  
  -- Avatar (if exists)
  PERFORM storage.delete_object('avatars', avatar_url)
  FROM profiles WHERE user_id = user_uuid AND avatar_url IS NOT NULL;
  
  -- Delete file usage tracking
  DELETE FROM file_usage 
  WHERE file_id IN (SELECT id FROM user_files WHERE user_id = user_uuid);
  
  -- Delete user files
  DELETE FROM user_files 
  WHERE user_id = user_uuid;
  
  -- Delete booking portfolio attachments
  DELETE FROM booking_portfolio_attachments 
  WHERE attached_by = user_uuid;
  
  -- Delete booking changes for user's bookings
  DELETE FROM booking_changes 
  WHERE booking_id IN (
    SELECT id FROM bookings 
    WHERE sender_id = user_uuid OR receiver_id = user_uuid
  );
  
  -- Delete bookings
  DELETE FROM bookings 
  WHERE sender_id = user_uuid OR receiver_id = user_uuid;
  
  -- Delete concept files
  DELETE FROM concept_files 
  WHERE creator_id = user_uuid;
  
  -- Delete concepts history
  DELETE FROM concepts_history 
  WHERE maker_id = user_uuid;
  
  -- Delete concepts (offers)
  DELETE FROM concepts 
  WHERE maker_id = user_uuid;
  
  -- Delete tickets purchased by user
  DELETE FROM tickets 
  WHERE user_id = user_uuid;
  
  -- Delete transactions
  DELETE FROM transactions 
  WHERE user_id = user_uuid;
  
  -- Delete events and events_market
  DELETE FROM events_market 
  WHERE created_by = user_uuid;
  
  -- Delete hospitality riders
  DELETE FROM hospitality_riders 
  WHERE user_id = user_uuid;
  
  -- Delete profile portfolio
  DELETE FROM profile_portfolio 
  WHERE user_id = user_uuid;
  
  -- Delete profile tech specs
  DELETE FROM profile_tech_specs 
  WHERE profile_id = user_uuid;
  
  -- Delete profile settings
  DELETE FROM profile_settings 
  WHERE maker_id = user_uuid;
  
  -- Delete notifications
  DELETE FROM notifications 
  WHERE user_id = user_uuid;
  
  -- Delete audit logs
  DELETE FROM audit_logs 
  WHERE user_id = user_uuid;
  
  -- Delete user roles
  DELETE FROM user_roles 
  WHERE user_id = user_uuid;
  
  -- Delete profile (this will cascade to auth.users if configured)
  DELETE FROM profiles 
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Successfully deleted all data including storage files for user % by requesting user %', user_uuid, requesting_user_id;
END;
$function$;