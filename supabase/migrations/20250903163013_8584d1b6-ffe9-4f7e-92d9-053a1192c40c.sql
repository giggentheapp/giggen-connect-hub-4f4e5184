-- Update get_secure_profile_data to not show contact info by default
-- Contact info should only be shared when a booking is accepted

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
    has_confirmed_booking BOOLEAN := false;
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
    
    -- Check if there's a confirmed booking between users (for contact info sharing)
    IF NOT is_own_profile THEN
        SELECT EXISTS (
            SELECT 1 FROM bookings 
            WHERE status = 'confirmed' 
            AND (
                (sender_id = auth.uid() AND receiver_id = target_user_id) OR 
                (sender_id = target_user_id AND receiver_id = auth.uid())
            )
        ) INTO has_confirmed_booking;
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
                COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
            INTO show_bio, show_location
            FROM profile_settings ps 
            WHERE ps.maker_id = target_user_id;
            
            -- Contact info only shown if there's a confirmed booking
            show_contact := has_confirmed_booking;
        ELSE
            -- For goer profiles, show basic info only
            show_bio := true;
            show_location := false;
            show_contact := has_confirmed_booking; -- Only if there's a confirmed booking
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