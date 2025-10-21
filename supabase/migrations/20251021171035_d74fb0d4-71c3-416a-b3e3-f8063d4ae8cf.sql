-- Enable users to delete their own tickets
CREATE POLICY "Users can delete their own tickets"
ON tickets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to delete portfolio file from storage and database
CREATE OR REPLACE FUNCTION delete_portfolio_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_path_var text;
BEGIN
  -- Get the file path
  SELECT file_path INTO file_path_var
  FROM profile_portfolio
  WHERE id = file_id AND user_id = auth.uid();
  
  IF file_path_var IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from storage
  PERFORM storage.delete_object('portfolio', file_path_var);
  
  -- Delete from database
  DELETE FROM profile_portfolio WHERE id = file_id AND user_id = auth.uid();
END;
$$;

-- Create function to delete concept file from storage and database
CREATE OR REPLACE FUNCTION delete_concept_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_path_var text;
  creator_id_var uuid;
BEGIN
  -- Get the file path and creator
  SELECT file_path, creator_id INTO file_path_var, creator_id_var
  FROM concept_files
  WHERE id = file_id;
  
  IF file_path_var IS NULL OR creator_id_var != auth.uid() THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from storage
  PERFORM storage.delete_object('concepts', file_path_var);
  
  -- Delete from database
  DELETE FROM concept_files WHERE id = file_id AND creator_id = auth.uid();
END;
$$;

-- Create function to delete tech spec file from storage and database
CREATE OR REPLACE FUNCTION delete_tech_spec_file(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_path_var text;
BEGIN
  -- Get the file path
  SELECT file_path INTO file_path_var
  FROM profile_tech_specs
  WHERE id = file_id AND profile_id = auth.uid();
  
  IF file_path_var IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from storage
  PERFORM storage.delete_object('tech-specs', file_path_var);
  
  -- Delete from database
  DELETE FROM profile_tech_specs WHERE id = file_id AND profile_id = auth.uid();
END;
$$;

-- Create function to delete hospitality rider from storage and database
CREATE OR REPLACE FUNCTION delete_hospitality_rider(file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_path_var text;
BEGIN
  -- Get the file path
  SELECT file_path INTO file_path_var
  FROM hospitality_riders
  WHERE id = file_id AND user_id = auth.uid();
  
  IF file_path_var IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
  
  -- Delete from storage
  PERFORM storage.delete_object('hospitality', file_path_var);
  
  -- Delete from database
  DELETE FROM hospitality_riders WHERE id = file_id AND user_id = auth.uid();
END;
$$;

-- Update the delete_user_data function to include tickets and storage cleanup
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all files from storage buckets first
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
  
  -- Avatar (if exists)
  PERFORM storage.delete_object('avatars', avatar_url)
  FROM profiles WHERE user_id = user_uuid AND avatar_url IS NOT NULL;
  
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
  
  -- Delete concepts
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
  
  -- Delete profile (this will cascade to auth.users if configured)
  DELETE FROM profiles 
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Successfully deleted all data including storage files for user %', user_uuid;
END;
$$;

-- Create function to permanently delete cancelled bookings
CREATE OR REPLACE FUNCTION delete_cancelled_booking(booking_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_status text;
  is_party boolean;
BEGIN
  -- Check if user is part of the booking
  SELECT status INTO booking_status
  FROM bookings
  WHERE id = booking_uuid
  AND (sender_id = auth.uid() OR receiver_id = auth.uid());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;
  
  IF booking_status != 'cancelled' THEN
    RAISE EXCEPTION 'Can only delete cancelled bookings';
  END IF;
  
  -- Delete booking changes
  DELETE FROM booking_changes WHERE booking_id = booking_uuid;
  
  -- Delete booking portfolio attachments
  DELETE FROM booking_portfolio_attachments WHERE booking_id = booking_uuid;
  
  -- Delete the booking
  DELETE FROM bookings WHERE id = booking_uuid;
  
  RAISE NOTICE 'Cancelled booking % permanently deleted', booking_uuid;
END;
$$;