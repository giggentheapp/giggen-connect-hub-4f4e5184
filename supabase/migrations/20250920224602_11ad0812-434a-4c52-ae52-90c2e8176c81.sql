-- Fix database permissions for Goer access - handle existing policies
-- Drop existing policies first, then recreate properly

-- Drop existing profile policies that may conflict
DROP POLICY IF EXISTS "goers_can_read_public_maker_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Restrict direct profile access" ON public.profiles;
DROP POLICY IF EXISTS "secure_public_map_data" ON public.profiles;

-- Create comprehensive profile access policy for goers
CREATE POLICY "goers_can_read_visible_maker_profiles" ON public.profiles
FOR SELECT USING (
  -- Users can always read their own profile
  (auth.uid() = user_id)
  OR
  -- Goers can read maker profiles that have visibility settings enabled
  (
    EXISTS (
      SELECT 1 FROM public.profiles viewer_profile 
      WHERE viewer_profile.user_id = auth.uid() 
      AND viewer_profile.role = 'goer'
    )
    AND profiles.role = 'maker'
    AND EXISTS (
      SELECT 1 FROM public.profile_settings ps 
      WHERE ps.maker_id = profiles.user_id 
      AND (ps.show_about = true OR ps.show_on_map = true OR ps.show_portfolio = true OR ps.show_events = true)
    )
  )
);

-- Recreate the secure map data policy  
CREATE POLICY "secure_public_map_data" ON public.profiles
FOR SELECT USING (
  (is_address_public = true) AND 
  EXISTS (
    SELECT 1 FROM public.profile_settings ps
    WHERE ps.maker_id = profiles.user_id AND ps.show_on_map = true
  )
);

-- Drop and recreate goer event policies  
DROP POLICY IF EXISTS "goers_can_read_public_events" ON public.events_market;
DROP POLICY IF EXISTS "goers_can_read_published_events" ON public.events;
DROP POLICY IF EXISTS "goers_can_read_public_portfolios" ON public.profile_portfolio;

-- Allow goers to read public events
CREATE POLICY "goers_can_read_public_events" ON public.events_market
FOR SELECT USING (
  auth.uid() IS NOT NULL AND is_public = true
);

-- Allow goers to read published events from events table
CREATE POLICY "goers_can_read_published_events" ON public.events
FOR SELECT USING (
  auth.uid() IS NOT NULL AND is_public = true
);

-- Allow goers to read public portfolio files when maker has enabled portfolio sharing
CREATE POLICY "goers_can_read_public_portfolios" ON public.profile_portfolio
FOR SELECT USING (
  -- Portfolio owner can always see their own
  (auth.uid() = user_id)
  OR
  -- Goers can see public portfolio files from makers who have enabled portfolio sharing
  (
    EXISTS (
      SELECT 1 FROM public.profiles viewer_profile 
      WHERE viewer_profile.user_id = auth.uid() 
      AND viewer_profile.role = 'goer'
    )
    AND is_public = true
    AND EXISTS (
      SELECT 1 FROM public.profile_settings ps 
      WHERE ps.maker_id = profile_portfolio.user_id 
      AND ps.show_portfolio = true
    )
  )
);