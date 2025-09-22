-- Fix user deletion function to handle foreign key constraints properly
CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete all user-related data in correct order to avoid foreign key violations
  
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
  
  -- Delete concepts history first
  DELETE FROM concepts_history 
  WHERE maker_id = user_uuid;
  
  -- Delete concepts
  DELETE FROM concepts 
  WHERE maker_id = user_uuid;
  
  -- Delete events and events_market
  DELETE FROM events_market 
  WHERE created_by = user_uuid;
  DELETE FROM events 
  WHERE maker_id = user_uuid;
  
  -- Delete hospitality riders
  DELETE FROM hospitality_riders 
  WHERE user_id = user_uuid;
  
  -- Delete profile portfolio
  DELETE FROM profile_portfolio 
  WHERE user_id = user_uuid;
  
  -- Delete profile tech specs BEFORE deleting profile
  DELETE FROM profile_tech_specs 
  WHERE profile_id = user_uuid;
  
  -- Delete profile settings
  DELETE FROM profile_settings 
  WHERE maker_id = user_uuid;
  
  -- Delete profile last (this will cascade to auth.users)
  DELETE FROM profiles 
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Successfully deleted all data for user %', user_uuid;
END;
$function$;

-- Create a trigger to automatically clean user data when auth user is deleted
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up all user data before the auth user is deleted
  PERFORM public.delete_user_data(OLD.id);
  RETURN OLD;
END;
$function$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_auth_user_deletion();