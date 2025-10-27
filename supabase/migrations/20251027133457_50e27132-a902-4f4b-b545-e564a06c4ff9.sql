-- Function to permanently delete a band and all related data
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

  -- Delete all files from storage buckets
  -- Band portfolio files
  PERFORM storage.delete_object('band-portfolio', file_path)
  FROM band_portfolio WHERE band_id = band_uuid;
  
  -- Band tech specs
  PERFORM storage.delete_object('band-tech-specs', file_path)
  FROM band_tech_specs WHERE band_id = band_uuid;
  
  -- Band hospitality riders
  PERFORM storage.delete_object('band-hospitality', file_path)
  FROM band_hospitality WHERE band_id = band_uuid;
  
  -- Delete band logo and banner from storage if they exist
  PERFORM storage.delete_object('bands', image_url)
  FROM bands WHERE id = band_uuid AND image_url IS NOT NULL;
  
  PERFORM storage.delete_object('bands', banner_url)
  FROM bands WHERE id = band_uuid AND banner_url IS NOT NULL;
  
  -- Delete band-related database records
  -- Delete band portfolio
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