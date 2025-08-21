-- Fix remaining functions to have proper search_path

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'goer')
  );
  RETURN NEW;
END;
$function$;

-- Fix create_profile_settings_for_maker function
CREATE OR REPLACE FUNCTION public.create_profile_settings_for_maker()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create settings if this is a maker and settings don't exist yet
  IF NEW.role = 'maker' AND NOT EXISTS (SELECT 1 FROM profile_settings WHERE maker_id = NEW.user_id) THEN
    INSERT INTO profile_settings (
      maker_id, 
      show_on_map, 
      show_about, 
      show_contact, 
      show_events, 
      show_portfolio, 
      show_techspec
    ) VALUES (
      NEW.user_id, 
      false, 
      false, 
      false, 
      false, 
      false, 
      false
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;