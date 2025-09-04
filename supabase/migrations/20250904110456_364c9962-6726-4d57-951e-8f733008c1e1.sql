-- Add cascade delete functions and policies for user account deletion

-- Function to delete all user data when user is deleted
CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all user-related data in correct order
  
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
  
  -- Delete concepts and concept history
  DELETE FROM concepts_history 
  WHERE maker_id = user_uuid;
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
  
  -- Delete profile files
  DELETE FROM profile_portfolio 
  WHERE user_id = user_uuid;
  DELETE FROM profile_tech_specs 
  WHERE profile_id = user_uuid;
  
  -- Delete profile settings
  DELETE FROM profile_settings 
  WHERE maker_id = user_uuid;
  
  -- Delete profile (this will also delete from auth.users due to CASCADE)
  DELETE FROM profiles 
  WHERE user_id = user_uuid;
END;
$$;

-- Enhanced RLS policies for user profile management
-- Ensure users can only update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for profile deletion (needed for user account deletion)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);