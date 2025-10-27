-- Fix the auth user deletion trigger to work with updated delete_user_data function
-- The trigger needs to pass both required parameters

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clean up all user data before the auth user is deleted
  -- Pass the user_id twice since the trigger is executing as the user being deleted
  PERFORM public.delete_user_data(OLD.id, OLD.id);
  RETURN OLD;
END;
$function$;

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deletion();