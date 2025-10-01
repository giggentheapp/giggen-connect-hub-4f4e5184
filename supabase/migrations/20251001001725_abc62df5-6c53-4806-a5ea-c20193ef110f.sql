-- First, drop policies that depend on the columns we want to remove
DROP POLICY IF EXISTS authenticated_can_view_public_portfolios ON profile_portfolio;

-- Recreate portfolio policy without show_portfolio dependency
-- Portfolio files are now controlled by the concept's is_published status
CREATE POLICY authenticated_can_view_public_portfolios ON profile_portfolio
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (is_public = true AND auth.uid() IS NOT NULL)
  );

-- Now we can safely update profile_settings table
-- Add new column for public profile visibility (profile picture, name, bio)
ALTER TABLE profile_settings 
ADD COLUMN IF NOT EXISTS show_public_profile boolean NOT NULL DEFAULT false;

-- Remove the granular toggles
ALTER TABLE profile_settings 
DROP COLUMN IF EXISTS show_about CASCADE,
DROP COLUMN IF EXISTS show_portfolio CASCADE,
DROP COLUMN IF EXISTS show_events CASCADE,
DROP COLUMN IF EXISTS show_techspec CASCADE;

-- Add comments to clarify the new structure
COMMENT ON COLUMN profile_settings.show_public_profile IS 'Controls visibility of profile picture, display name, and bio to public';
COMMENT ON COLUMN profile_settings.show_on_map IS 'Controls visibility on map and public address';
COMMENT ON COLUMN profile_settings.show_contact IS 'Controls if contact info can be shared through active bookings';

-- Update the get_public_artists_for_explore function to use new column
CREATE OR REPLACE FUNCTION public.get_public_artists_for_explore()
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
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id,
        p.user_id,
        p.display_name,
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
        p.is_address_public
    FROM profiles p
    LEFT JOIN profile_settings ps ON ps.maker_id = p.user_id
    WHERE p.role = 'artist'
      AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
      AND ps.show_public_profile = true;
END;
$function$;

-- Update get_public_profile function
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
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
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    show_profile BOOLEAN := false;
    show_location BOOLEAN := false;
BEGIN
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    IF profile_record.role = 'artist' THEN
        SELECT 
            COALESCE(ps.show_public_profile, false),
            COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
        INTO show_profile, show_location
        FROM profile_settings ps 
        WHERE ps.maker_id = target_user_id;
    END IF;
    
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        CASE WHEN show_profile THEN profile_record.display_name ELSE NULL END,
        profile_record.role::TEXT,
        CASE WHEN show_profile THEN profile_record.avatar_url ELSE NULL END,
        profile_record.created_at,
        CASE WHEN show_profile THEN profile_record.bio ELSE NULL END,
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public;
END;
$function$;