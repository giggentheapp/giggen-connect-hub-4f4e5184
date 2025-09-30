-- ============================================
-- Oppdater alle policies som bruker is_maker til is_artist
-- ============================================

-- Profile settings policies
DROP POLICY IF EXISTS "Makers can create their own settings" ON profile_settings;
CREATE POLICY "Artists can create their own settings"
ON profile_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Makers can update their own settings" ON profile_settings;
CREATE POLICY "Artists can update their own settings"
ON profile_settings FOR UPDATE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

-- Concepts policies
DROP POLICY IF EXISTS "Only makers can create concepts" ON concepts;
CREATE POLICY "Only artists can create concepts"
ON concepts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only concept owners can update their concepts" ON concepts;
CREATE POLICY "Only concept owners can update their concepts"
ON concepts FOR UPDATE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only concept owners can delete their concepts" ON concepts;
CREATE POLICY "Only concept owners can delete their concepts"
ON concepts FOR DELETE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only makers can view concepts" ON concepts;
CREATE POLICY "Only artists can view concepts"
ON concepts FOR SELECT
TO authenticated
USING (is_artist(auth.uid()));

-- Profile portfolio policies
DROP POLICY IF EXISTS "Only makers can create portfolio files" ON profile_portfolio;
CREATE POLICY "Only artists can create portfolio files"
ON profile_portfolio FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only portfolio owners can delete their files" ON profile_portfolio;
CREATE POLICY "Only portfolio owners can delete their files"
ON profile_portfolio FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only portfolio owners can update their files" ON profile_portfolio;
CREATE POLICY "Only portfolio owners can update their files"
ON profile_portfolio FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_artist(auth.uid()));

-- Profile tech specs policies
DROP POLICY IF EXISTS "Only owners can access tech specs" ON profile_tech_specs;
CREATE POLICY "Only owners can access tech specs"
ON profile_tech_specs FOR ALL
TO authenticated
USING (auth.uid() = profile_id AND is_artist(auth.uid()));

-- Hospitality riders policies
DROP POLICY IF EXISTS "Only owners can access hospitality riders" ON hospitality_riders;
CREATE POLICY "Only owners can access hospitality riders"
ON hospitality_riders FOR ALL
TO authenticated
USING (auth.uid() = user_id AND is_artist(auth.uid()));

-- Events policies
DROP POLICY IF EXISTS "Makers can view their own events" ON events;
CREATE POLICY "Artists can view their own events"
ON events FOR SELECT
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only makers can create events" ON events;
CREATE POLICY "Only artists can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only event owners can update their events" ON events;
CREATE POLICY "Only event owners can update their events"
ON events FOR UPDATE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

DROP POLICY IF EXISTS "Only event owners can delete their events" ON events;
CREATE POLICY "Only event owners can delete their events"
ON events FOR DELETE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

-- Bookings policies
DROP POLICY IF EXISTS "create_booking_request" ON bookings;
CREATE POLICY "create_booking_request"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = sender_id AND 
  is_artist(auth.uid()) AND 
  status = 'pending'::booking_status
);

-- ============================================
-- Oppdater trigger funksjoner
-- ============================================

DROP FUNCTION IF EXISTS create_profile_settings_for_maker() CASCADE;

CREATE OR REPLACE FUNCTION public.create_profile_settings_for_artist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'artist' AND NOT EXISTS (SELECT 1 FROM profile_settings WHERE maker_id = NEW.user_id) THEN
    INSERT INTO profile_settings (
      maker_id, 
      show_on_map, 
      show_about, 
      show_contact, 
      show_events, 
      show_portfolio, 
      show_techspec
    ) VALUES (
      NEW.user_id, 
      false, 
      false, 
      false, 
      false, 
      false, 
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- Oppdater RPC funksjoner
-- ============================================

DROP FUNCTION IF EXISTS get_public_makers_for_explore() CASCADE;

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
AS $$
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
            WHEN ps.show_about = true THEN p.bio 
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
      AND (
          ps.show_on_map = true OR 
          ps.show_about = true OR
          ps.show_portfolio = true OR
          ps.show_events = true
      );
END;
$$;

DROP FUNCTION IF EXISTS get_all_visible_makers() CASCADE;

CREATE OR REPLACE FUNCTION public.get_all_visible_artists()
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
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id,
        p.user_id,
        p.display_name,
        p.role::text,
        p.avatar_url,
        p.created_at,
        CASE 
            WHEN p.user_id = auth.uid() THEN p.bio
            WHEN ps.show_about = true THEN p.bio 
            ELSE NULL 
        END as bio,
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
    WHERE p.role = 'artist'
      AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

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
AS $$
DECLARE
    profile_record RECORD;
    show_bio BOOLEAN := false;
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
            COALESCE(ps.show_about, false),
            COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
        INTO show_bio, show_location
        FROM profile_settings ps 
        WHERE ps.maker_id = target_user_id;
    END IF;
    
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        profile_record.display_name,
        profile_record.role::TEXT,
        profile_record.avatar_url,
        profile_record.created_at,
        CASE WHEN show_bio THEN profile_record.bio ELSE NULL END,
        CASE WHEN show_location THEN profile_record.address ELSE NULL END,
        CASE WHEN show_location THEN profile_record.latitude ELSE NULL END,
        CASE WHEN show_location THEN profile_record.longitude ELSE NULL END,
        profile_record.is_address_public;
END;
$$;

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
SET search_path TO 'public'
AS $$
DECLARE
    profile_record RECORD;
    is_own_profile BOOLEAN := false;
    show_bio BOOLEAN := false;
    show_location BOOLEAN := false;
    show_contact BOOLEAN := false;
    has_active_booking BOOLEAN := false;
BEGIN
    is_own_profile := (auth.uid() = target_user_id);
    
    SELECT * INTO profile_record 
    FROM profiles p 
    WHERE p.user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    IF NOT is_own_profile THEN
        SELECT public.has_active_booking_with_user(target_user_id) INTO has_active_booking;
    END IF;
    
    IF is_own_profile THEN
        show_bio := true;
        show_location := true;
        show_contact := true;
    ELSE
        IF profile_record.role = 'artist' THEN
            SELECT 
                COALESCE(ps.show_about, false),
                COALESCE(ps.show_on_map, false) AND profile_record.is_address_public
            INTO show_bio, show_location
            FROM profile_settings ps 
            WHERE ps.maker_id = target_user_id;
            
            show_contact := has_active_booking;
        ELSE
            show_bio := false;
            show_location := false;
            show_contact := has_active_booking;
        END IF;
    END IF;
    
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