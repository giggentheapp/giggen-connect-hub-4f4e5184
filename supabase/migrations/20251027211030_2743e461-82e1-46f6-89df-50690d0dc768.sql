-- Drop and recreate get_public_profile with username field
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
    is_address_public boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    show_profile BOOLEAN := true; -- Default to TRUE if no settings exist
    show_location BOOLEAN := false;
    settings_exist BOOLEAN := false;
BEGIN
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Check if profile_settings exist for this user
    SELECT EXISTS (
        SELECT 1 FROM profile_settings WHERE maker_id = target_user_id
    ) INTO settings_exist;
    
    -- Only apply privacy settings if they exist
    IF settings_exist THEN
        -- Show for BOTH musician and organizer
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
        CASE WHEN show_profile THEN profile_record.username ELSE NULL END,
        profile_record.role::text,
        CASE WHEN show_profile THEN profile_record.avatar_url ELSE NULL END,
        profile_record.created_at,
        CASE WHEN show_profile THEN profile_record.bio ELSE NULL END,
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;