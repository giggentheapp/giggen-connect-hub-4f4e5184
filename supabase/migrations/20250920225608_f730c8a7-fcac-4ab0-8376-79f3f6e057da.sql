-- CRITICAL FIX: Remove infinite recursion in RLS policies

-- Step 1: Temporarily disable RLS on all affected tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE concepts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE events_market DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "goers_can_read_visible_maker_profiles" ON profiles;
DROP POLICY IF EXISTS "goers_can_read_maker_profiles" ON profiles;
DROP POLICY IF EXISTS "makers_can_read_goer_profiles" ON profiles;
DROP POLICY IF EXISTS "only_makers_can_access_concepts" ON concepts;
DROP POLICY IF EXISTS "goers_can_read_public_events" ON events_market;
DROP POLICY IF EXISTS "only_makers_can_access_bookings" ON bookings;
DROP POLICY IF EXISTS "goers_can_read_public_portfolios" ON profile_portfolio;
DROP POLICY IF EXISTS "secure_public_map_data" ON profiles;
DROP POLICY IF EXISTS "goers_can_read_published_events" ON events;
DROP POLICY IF EXISTS "goers_can_read_public_portfolios" ON profile_portfolio;

-- Step 3: Re-enable RLS with simple, non-recursive policies

-- PROFILES: Simple policies without JWT role checks
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_public_makers" ON profiles  
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  role = 'maker' AND
  user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON profiles
FOR DELETE USING (auth.uid() = user_id);

-- CONCEPTS: Simple ownership-based policies
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concepts_select_own_or_published" ON concepts
FOR SELECT USING (
  auth.uid() = maker_id OR 
  (is_published = true AND auth.uid() IS NOT NULL)
);

CREATE POLICY "concepts_all_own" ON concepts
FOR ALL USING (auth.uid() = maker_id);

-- BOOKINGS: Simple party-based access
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_party_access" ON bookings
FOR ALL USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

CREATE POLICY "bookings_public_published" ON bookings
FOR SELECT USING (
  status = 'upcoming' AND 
  is_public_after_approval = true AND 
  both_parties_approved = true AND
  auth.uid() IS NOT NULL
);

-- EVENTS_MARKET: Simple public/owner access
ALTER TABLE events_market ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_market_public_read" ON events_market
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  is_public = true
);

CREATE POLICY "events_market_owner_all" ON events_market
FOR ALL USING (auth.uid() = created_by);

-- EVENTS: Simple public/owner access  
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON events
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  is_public = true
);

CREATE POLICY "events_owner_all" ON events
FOR ALL USING (auth.uid() = maker_id);

-- PROFILE_PORTFOLIO: Simple visibility-based access
ALTER TABLE profile_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_owner_all" ON profile_portfolio
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "portfolio_public_read" ON profile_portfolio
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  is_public = true AND
  EXISTS (
    SELECT 1 FROM profile_settings ps 
    WHERE ps.maker_id = profile_portfolio.user_id 
    AND ps.show_portfolio = true
  )
);

-- Add service role access for all tables
CREATE POLICY "service_role_profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_concepts" ON concepts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_bookings" ON bookings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_events_market" ON events_market FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_portfolio" ON profile_portfolio FOR ALL USING (auth.role() = 'service_role');