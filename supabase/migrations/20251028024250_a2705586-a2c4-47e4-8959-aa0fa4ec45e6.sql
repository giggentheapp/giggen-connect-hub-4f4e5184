-- Drop and recreate get_public_profile to include social_media_links and instruments
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE FUNCTION public.get_public_profile(target_user_id uuid)
 RETURNS TABLE(
   id uuid, 
   user_id uuid, 
   display_name text, 
   username text, 
   role text, 
   avatar_url text, 
   created_at timestamp with time zone, 
   bio text, 
   address text, 
   latitude numeric, 
   longitude numeric, 
   is_address_public boolean,
   social_media_links jsonb,
   instruments jsonb
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    show_profile BOOLEAN := true;
    show_location BOOLEAN := false;
    settings_exist BOOLEAN := false;
BEGIN
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM profile_settings WHERE maker_id = target_user_id
    ) INTO settings_exist;
    
    IF settings_exist THEN
        IF profile_record.role IN ('musician', 'organizer') THEN
            SELECT 
                COALESCE(ps.show_public_profile, true),
                COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
            INTO show_profile, show_location
            FROM profile_settings ps 
            WHERE ps.maker_id = target_user_id;
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        CASE WHEN show_profile THEN profile_record.display_name ELSE NULL END,
        CASE WHEN show_profile THEN profile_record.username::text ELSE NULL END,
        profile_record.role::text,
        CASE WHEN show_profile THEN profile_record.avatar_url ELSE NULL END,
        profile_record.created_at,
        CASE WHEN show_profile THEN profile_record.bio ELSE NULL END,
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public,
        CASE WHEN show_profile THEN profile_record.social_media_links ELSE NULL END,
        CASE WHEN show_profile THEN profile_record.instruments ELSE NULL END;
END;
$function$;