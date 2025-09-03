-- Fix the last function with search_path issue
CREATE OR REPLACE FUNCTION public.set_creator_id_on_concept_files()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set creator_id to the authenticated user's ID
  NEW.creator_id = auth.uid();
  RETURN NEW;
END;
$function$;