-- Fix get_public_artists_for_explore to use correct role values from database
DROP FUNCTION IF EXISTS public.get_public_artists_for_explore();

CREATE OR REPLACE FUNCTION public.get_public_artists_for_explore()
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
  privacy_settings jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id,
        p.user_id,
        p.display_name,
        p.username,
        p.role::TEXT,
        p.avatar_url,
        p.created_at,
        CASE 
            WHEN ps.show_public_profile = true THEN p.bio 
            ELSE NULL 
        END as bio,
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
        p.is_address_public,
        p.privacy_settings
    FROM profiles p
    LEFT JOIN profile_settings ps ON ps.maker_id = p.user_id
    WHERE p.role IN ('musician', 'organizer')
      AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
      AND ps.show_public_profile = true;
END;
$$;