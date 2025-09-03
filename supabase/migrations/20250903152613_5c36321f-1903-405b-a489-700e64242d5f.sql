-- Create function for getting multiple public profiles for explore functionality
CREATE OR REPLACE FUNCTION public.get_public_makers_for_explore()
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
BEGIN
    -- Return makers that have made their profiles visible
    RETURN QUERY 
    SELECT 
        p.id,
        p.user_id,
        p.display_name,
        p.role::TEXT,
        p.avatar_url,
        p.created_at,
        -- Only show bio if maker has enabled it
        CASE 
            WHEN ps.show_about = true THEN p.bio 
            ELSE NULL 
        END as bio,
        -- Only show location if maker has made it public and enabled on map
        CASE 
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.address 
            ELSE NULL 
        END as address,
        CASE 
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.latitude 
            ELSE NULL 
        END as latitude,
        CASE 
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.longitude 
            ELSE NULL 
        END as longitude,
        p.is_address_public
    FROM profiles p
    LEFT JOIN profile_settings ps ON ps.maker_id = p.user_id
    WHERE p.role = 'maker'
      AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
          -- Show if they have any visibility settings enabled
          ps.show_on_map = true OR 
          ps.show_about = true OR
          ps.show_portfolio = true OR
          ps.show_events = true
      );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_makers_for_explore() TO authenticated;