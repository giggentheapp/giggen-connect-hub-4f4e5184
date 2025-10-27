-- Add better error logging and debugging
CREATE OR REPLACE FUNCTION public.delete_band_permanently(band_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_role text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Debug: Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated';
  END IF;
  
  -- Get user's role in the band
  SELECT role INTO user_role
  FROM band_members
  WHERE band_id = band_uuid 
  AND user_id = current_user_id;
  
  -- Debug: Check if user is a member
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User is not a member of this band. User ID: %, Band ID: %', current_user_id, band_uuid;
  END IF;
  
  -- Check if the user is the founder OR admin of the band
  IF user_role NOT IN ('founder', 'admin') THEN
    RAISE EXCEPTION 'Only the band founder or admin can delete the band. Your role: %', user_role;
  END IF;

  -- Delete band portfolio files
  DELETE FROM band_portfolio WHERE band_id = band_uuid;
  
  -- Delete band tech specs
  DELETE FROM band_tech_specs WHERE band_id = band_uuid;
  
  -- Delete band hospitality riders
  DELETE FROM band_hospitality WHERE band_id = band_uuid;
  
  -- Delete band invites
  DELETE FROM band_invites WHERE band_id = band_uuid;
  
  -- Delete band members
  DELETE FROM band_members WHERE band_id = band_uuid;
  
  -- Finally, delete the band itself
  DELETE FROM bands WHERE id = band_uuid;
  
  RAISE NOTICE 'Successfully deleted band % by user %', band_uuid, current_user_id;
END;
$function$;