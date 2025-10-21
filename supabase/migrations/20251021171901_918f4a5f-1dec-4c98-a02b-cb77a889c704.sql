-- Fix storage deletion functions - remove the storage function calls that don't exist
-- Update delete_portfolio_file to use storage API correctly
CREATE OR REPLACE FUNCTION delete_portfolio_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get the file path
  SELECT file_path, user_id INTO file_record
  FROM profile_portfolio
  WHERE id = file_id AND user_id = auth.uid();
  
  IF file_record.file_path IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from database (storage will be handled by application)
  DELETE FROM profile_portfolio WHERE id = file_id AND user_id = auth.uid();
END;
$$;

-- Update delete_concept_file
CREATE OR REPLACE FUNCTION delete_concept_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get the file path and creator
  SELECT file_path, creator_id INTO file_record
  FROM concept_files
  WHERE id = file_id;
  
  IF file_record.file_path IS NULL OR file_record.creator_id != auth.uid() THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from database (storage will be handled by application)
  DELETE FROM concept_files WHERE id = file_id AND creator_id = auth.uid();
END;
$$;

-- Update delete_tech_spec_file
CREATE OR REPLACE FUNCTION delete_tech_spec_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get the file path
  SELECT file_path, profile_id INTO file_record
  FROM profile_tech_specs
  WHERE id = file_id AND profile_id = auth.uid();
  
  IF file_record.file_path IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from database (storage will be handled by application)
  DELETE FROM profile_tech_specs WHERE id = file_id AND profile_id = auth.uid();
END;
$$;

-- Update delete_hospitality_rider
CREATE OR REPLACE FUNCTION delete_hospitality_rider(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get the file path
  SELECT file_path, user_id INTO file_record
  FROM hospitality_riders
  WHERE id = file_id AND user_id = auth.uid();
  
  IF file_record.file_path IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from database (storage will be handled by application)
  DELETE FROM hospitality_riders WHERE id = file_id AND user_id = auth.uid();
END;
$$;