-- Fix function search_path security issues
-- Update is_maker function to have secure search_path
CREATE OR REPLACE FUNCTION public.is_maker(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'maker'
  );
END;
$function$;

-- Update get_current_user_role function to have secure search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$function$;