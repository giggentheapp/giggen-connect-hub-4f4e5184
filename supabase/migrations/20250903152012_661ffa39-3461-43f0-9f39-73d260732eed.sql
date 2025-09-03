-- Fix security definer view issue and improve the approach

-- Drop the problematic view
DROP VIEW IF EXISTS public.public_profiles;

-- Instead, create a secure function for public profile access
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    display_name TEXT,
    role TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    bio TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    is_address_public BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_record RECORD;
    show_bio BOOLEAN := false;
    show_location BOOLEAN := false;
BEGIN
    -- Get the profile record
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Check visibility settings for makers
    IF profile_record.role = 'maker' THEN
        SELECT 
            COALESCE(ps.show_about, false),
            COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
        INTO show_bio, show_location
        FROM profile_settings ps 
        WHERE ps.maker_id = target_user_id;
    END IF;
    
    -- Return safe public fields
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        profile_record.display_name,
        profile_record.role::TEXT,
        profile_record.avatar_url,
        profile_record.created_at,
        -- Only show bio if maker has enabled it
        CASE WHEN show_bio THEN profile_record.bio ELSE NULL END,
        -- Only show location if maker has made it public and enabled on map
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;

-- Ensure only own profile access on main table
DROP POLICY IF EXISTS "Users can view public profile data of others" ON public.profiles;

-- The main profiles table now only allows access to own profile
-- All other profile viewing must go through the secure function