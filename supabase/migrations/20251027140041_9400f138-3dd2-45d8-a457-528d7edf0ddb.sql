-- Create function to delete user from auth.users
-- This function allows a user to delete themselves from the auth system
CREATE OR REPLACE FUNCTION public.delete_auth_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete their account';
  END IF;
  
  -- Delete the user from auth.users
  -- This will also trigger the on_auth_user_deleted trigger if it exists
  DELETE FROM auth.users WHERE id = current_user_id;
  
  RAISE NOTICE 'Successfully deleted user % from auth.users', current_user_id;
END;
$function$;