-- Recreate function with correct storage deletion method
CREATE OR REPLACE FUNCTION public.delete_band_permanently(band_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user is the founder of the band
  IF NOT EXISTS (
    SELECT 1 FROM band_members
    WHERE band_id = band_uuid 
    AND user_id = auth.uid() 
    AND role = 'founder'
  ) THEN
    RAISE EXCEPTION 'Only the band founder can delete the band';
  END IF;

  -- Delete storage files by removing database records
  -- The storage policy will handle actual file deletion
  
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
  
  RAISE NOTICE 'Successfully deleted band % and all related data', band_uuid;
END;
$function$;