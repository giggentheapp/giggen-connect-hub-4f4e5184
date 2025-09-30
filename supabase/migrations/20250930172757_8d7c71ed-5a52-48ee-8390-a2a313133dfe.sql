-- ============================================
-- FASE 1: Drop alle policies og constraints
-- ============================================

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "public_can_view_basic_maker_profiles" ON profiles;
DROP POLICY IF EXISTS "public_can_view_basic_artist_profiles" ON profiles;
DROP POLICY IF EXISTS "Makers can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Artists can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Goers can update profile except avatar" ON profiles;
DROP POLICY IF EXISTS "Audience can update profile except avatar" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON profiles;
DROP POLICY IF EXISTS "service_role_full_access_profiles" ON profiles;

-- ============================================
-- FASE 2: Oppdater role enum type
-- ============================================

-- Remove default value first
ALTER TABLE profiles 
ALTER COLUMN role DROP DEFAULT;

-- Create new enum type
CREATE TYPE user_role_new AS ENUM ('artist', 'audience');

-- Change column to text temporarily
ALTER TABLE profiles 
ALTER COLUMN role TYPE text;

-- Update existing values
UPDATE profiles 
SET role = 'artist' 
WHERE role = 'maker';

UPDATE profiles 
SET role = 'audience' 
WHERE role = 'goer';

-- Change column to new enum
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role_new USING role::user_role_new;

-- Drop old enum and rename new one
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_new RENAME TO user_role;

-- Set new default
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'audience'::user_role;

-- ============================================
-- FASE 3: Recreate profiles policies
-- ============================================

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Artists can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND role = 'artist'::user_role)
WITH CHECK (auth.uid() = user_id AND role = 'artist'::user_role);

CREATE POLICY "Audience can update profile except avatar"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND role = 'audience'::user_role)
WITH CHECK (auth.uid() = user_id AND role = 'audience'::user_role);

CREATE POLICY "public_can_view_basic_artist_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  role = 'artist'::user_role AND 
  ((privacy_settings->>'show_profile_to_goers')::boolean = true) AND 
  auth.uid() IS NOT NULL AND 
  auth.uid() <> user_id
);

CREATE POLICY "service_role_full_access_profiles"
ON profiles FOR ALL
TO authenticated
USING (auth.role() = 'service_role'::text);

-- ============================================
-- FASE 4: Oppdater funksjoner
-- ============================================

-- Update is_maker to is_artist
DROP FUNCTION IF EXISTS is_maker(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_artist(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'artist'
  );
END;
$$;

-- Update get_current_user_role
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;