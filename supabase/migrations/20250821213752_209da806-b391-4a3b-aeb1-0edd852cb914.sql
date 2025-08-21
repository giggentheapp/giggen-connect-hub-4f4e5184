-- Fix function search path security issue
-- Update existing functions to have immutable search_path

-- Fix get_profile_visibility function
CREATE OR REPLACE FUNCTION public.get_profile_visibility(maker_uuid uuid)
 RETURNS TABLE(show_about boolean, show_contact boolean, show_portfolio boolean, show_techspec boolean, show_events boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ps.show_about, ps.show_contact, ps.show_portfolio, ps.show_techspec, ps.show_events
  FROM public.profile_settings ps
  WHERE ps.maker_id = maker_uuid;
END;
$function$;

-- Fix get_current_user_role function
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

-- Fix is_maker function  
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