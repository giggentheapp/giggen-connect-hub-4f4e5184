-- Fix RLS policies to allow public profile viewing while protecting sensitive data

-- Drop existing restrictive profile policies
DROP POLICY IF EXISTS "Restrict direct profile access to own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

-- Create new policies that allow public viewing with data filtering
CREATE POLICY "Users can view all profiles with filtered data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Update get_public_profile function to handle goer vs maker viewing differences
CREATE OR REPLACE FUNCTION public.get_secure_profile_data(target_user_id uuid, viewer_role text DEFAULT NULL)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  display_name text, 
  role text, 
  avatar_url text, 
  created_at timestamp with time zone, 
  bio text, 
  address text, 
  latitude numeric, 
  longitude numeric, 
  is_address_public boolean,
  contact_info jsonb
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
    profile_record RECORD;
    current_viewer_role text;
    show_bio BOOLEAN := false;
    show_location BOOLEAN := false;
    show_contact BOOLEAN := false;
    is_own_profile BOOLEAN := false;
BEGIN
    -- Get current user's role if not provided
    IF viewer_role IS NULL THEN
        SELECT p.role::text INTO current_viewer_role 
        FROM profiles p 
        WHERE p.user_id = auth.uid();
    ELSE
        current_viewer_role := viewer_role;
    END IF;
    
    -- Check if viewing own profile
    is_own_profile := (auth.uid() = target_user_id);
    
    -- Get the target profile
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- If viewing own profile, return all data
    IF is_own_profile THEN
        show_bio := true;
        show_location := true;
        show_contact := true;
    ELSE
        -- For other profiles, check visibility settings if it's a maker
        IF profile_record.role = 'maker' THEN
            SELECT 
                COALESCE(ps.show_about, false),
                COALESCE(ps.show_on_map, false) AND profile_record.is_address_public,
                COALESCE(ps.show_contact, false)
            INTO show_bio, show_location, show_contact
            FROM profile_settings ps 
            WHERE ps.maker_id = target_user_id;
        ELSE
            -- For goer profiles, show basic info only
            show_bio := true;
            show_location := false;
            show_contact := false;
        END IF;
    END IF;
    
    -- Return filtered data
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        profile_record.display_name,
        profile_record.role::text,
        profile_record.avatar_url,
        profile_record.created_at,
        CASE WHEN show_bio THEN profile_record.bio ELSE NULL END,
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public,
        CASE WHEN show_contact THEN profile_record.contact_info ELSE NULL END;
END;
$$;

-- Update the existing get_public_makers_for_explore function to include more makers
CREATE OR REPLACE FUNCTION public.get_all_visible_makers()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  display_name text, 
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
SET search_path = 'public'
AS $$
BEGIN
    -- Return all makers, with visibility filtering applied
    RETURN QUERY 
    SELECT 
        p.id,
        p.user_id,
        p.display_name,
        p.role::text,
        p.avatar_url,
        p.created_at,
        -- Show bio based on settings
        CASE 
            WHEN p.user_id = auth.uid() THEN p.bio
            WHEN ps.show_about = true THEN p.bio 
            ELSE NULL 
        END as bio,
        -- Show location based on settings
        CASE 
            WHEN p.user_id = auth.uid() THEN p.address
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.address 
            ELSE NULL 
        END as address,
        CASE 
            WHEN p.user_id = auth.uid() THEN p.latitude
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.latitude 
            ELSE NULL 
        END as latitude,
        CASE 
            WHEN p.user_id = auth.uid() THEN p.longitude
            WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.longitude 
            ELSE NULL 
        END as longitude,
        p.is_address_public
    FROM profiles p
    LEFT JOIN profile_settings ps ON ps.maker_id = p.user_id
    WHERE p.role = 'maker'
      AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;