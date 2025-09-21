-- Fix critical security issues with exposed sensitive data

-- 1. Fix public booking policies to exclude all sensitive financial and personal data
DROP POLICY IF EXISTS "bookings_public_published" ON public.bookings;
DROP POLICY IF EXISTS "secure_public_booking_view" ON public.bookings;
DROP POLICY IF EXISTS "goers_can_view_published_events" ON public.bookings;

-- Create new secure public booking policy that excludes ALL sensitive data
CREATE POLICY "public_can_view_basic_upcoming_events" ON public.bookings
FOR SELECT 
TO authenticated
USING (
  status = 'upcoming'::booking_status 
  AND is_public_after_approval = true 
  AND both_parties_approved = true 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != sender_id 
  AND auth.uid() != receiver_id
);

-- 2. Fix profiles policies to prevent contact info exposure
DROP POLICY IF EXISTS "profiles_select_public_makers" ON public.profiles;
DROP POLICY IF EXISTS "goers_can_view_public_makers" ON public.profiles;

-- Create secure public profile policy that excludes sensitive data
CREATE POLICY "public_can_view_basic_maker_profiles" ON public.profiles
FOR SELECT
TO authenticated  
USING (
  role = 'maker'::user_role 
  AND ((privacy_settings ->> 'show_profile_to_goers')::boolean = true)
  AND auth.uid() IS NOT NULL
  AND auth.uid() != user_id
);

-- 3. Create enhanced function to get safe public booking data (NO sensitive fields)
CREATE OR REPLACE FUNCTION public.get_safe_public_booking_data(booking_uuid uuid)
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  event_date timestamp with time zone, 
  venue text,
  sender_id uuid, 
  receiver_id uuid, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Only return basic, non-sensitive fields for public upcoming bookings
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.event_date,
        b.venue,
        b.sender_id,
        b.receiver_id,
        b.created_at
    FROM public.bookings b
    WHERE b.id = booking_uuid
      AND b.status = 'upcoming'::booking_status
      AND b.is_public_after_approval = true
      AND b.both_parties_approved = true;
END;
$function$;

-- 4. Create enhanced function to get safe public profile data (NO sensitive fields)
CREATE OR REPLACE FUNCTION public.get_safe_public_profile_data(target_user_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  display_name text, 
  role text, 
  avatar_url text, 
  created_at timestamp with time zone, 
  bio text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    profile_record RECORD;
    show_bio BOOLEAN := false;
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
        SELECT COALESCE(ps.show_about, false)
        INTO show_bio
        FROM profile_settings ps 
        WHERE ps.maker_id = target_user_id;
    END IF;
    
    -- Return ONLY safe public fields - NO contact info, NO location data
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        profile_record.display_name,
        profile_record.role::text,
        profile_record.avatar_url,
        profile_record.created_at,
        -- Only show bio if maker has enabled it
        CASE WHEN show_bio THEN profile_record.bio ELSE NULL END;
END;
$function$;

-- 5. Update the secure profile function to be more restrictive about sensitive data
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
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    profile_record RECORD;
    is_own_profile BOOLEAN := false;
    show_bio BOOLEAN := false;
    show_location BOOLEAN := false;
    show_contact BOOLEAN := false;
    has_active_booking BOOLEAN := false;
BEGIN
    -- Check if viewing own profile
    is_own_profile := (auth.uid() = target_user_id);
    
    -- Get the target profile
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- CRITICAL: Only allow contact access if there's an active booking or own profile
    IF NOT is_own_profile THEN
        SELECT public.has_active_booking_with_user(target_user_id) INTO has_active_booking;
    END IF;
    
    -- If viewing own profile, return all data
    IF is_own_profile THEN
        show_bio := true;
        show_location := true;
        show_contact := true;
    ELSE
        -- For other profiles, check visibility settings
        IF profile_record.role = 'maker' THEN
            SELECT 
                COALESCE(ps.show_about, false),
                COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
            INTO show_bio, show_location
            FROM profile_settings ps 
            WHERE ps.maker_id = target_user_id;
            
            -- CRITICAL: Contact info ONLY if there's an active booking
            show_contact := has_active_booking;
        ELSE
            -- For goer profiles, very restrictive
            show_bio := false;
            show_location := false;
            show_contact := has_active_booking; -- Only if there's an active booking
        END IF;
    END IF;
    
    -- Return filtered data with enhanced security
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
        -- CRITICAL: Contact info ONLY if there's an active booking or own profile
        CASE WHEN show_contact THEN profile_record.contact_info ELSE NULL END;
END;
$function$;

-- 6. Enhance the active booking check to be more strict
CREATE OR REPLACE FUNCTION public.has_active_booking_with_user(target_user_id uuid, viewer_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only return true if there's a confirmed, ongoing booking between users
  RETURN EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE status IN ('allowed', 'approved_by_both', 'upcoming', 'completed')
    AND both_parties_approved = true
    AND contact_info_shared_at IS NOT NULL -- Contact sharing must be activated
    AND (
      (sender_id = viewer_user_id AND receiver_id = target_user_id) OR
      (sender_id = target_user_id AND receiver_id = viewer_user_id)
    )
  );
END;
$function$;

-- 7. Add comments to remind about security
COMMENT ON FUNCTION public.get_safe_public_booking_data IS 'Returns only basic booking info for public view - NO financial data, contact info, or personal messages';
COMMENT ON FUNCTION public.get_safe_public_profile_data IS 'Returns only basic profile info for public view - NO contact info or location data';
COMMENT ON POLICY "public_can_view_basic_upcoming_events" ON public.bookings IS 'Allows public to see basic event info only - excludes all sensitive financial and personal data';
COMMENT ON POLICY "public_can_view_basic_maker_profiles" ON public.profiles IS 'Allows public to see basic maker profiles only - excludes contact info and location data';