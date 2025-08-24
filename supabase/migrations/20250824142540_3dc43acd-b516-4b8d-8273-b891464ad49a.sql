-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.set_profile_id_on_tech_specs()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.profile_id = auth.uid();
  RETURN NEW;
END;
$$;