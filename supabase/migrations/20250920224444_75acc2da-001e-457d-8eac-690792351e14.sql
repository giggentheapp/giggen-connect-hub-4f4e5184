-- Fix database permissions for Goer access
-- Allow goers to read public maker profiles safely

-- Drop existing restrictive policies that may block goer access
DROP POLICY IF EXISTS "Restrict direct profile access" ON public.profiles;

-- Create comprehensive profile access policy for goers
CREATE POLICY "goers_can_read_public_maker_profiles" ON public.profiles
FOR SELECT USING (
  -- Users can always read their own profile
  (auth.uid() = user_id)
  OR
  -- Goers can read maker profiles that have show_about or show_on_map enabled
  (
    EXISTS (
      SELECT 1 FROM public.profiles viewer_profile 
      WHERE viewer_profile.user_id = auth.uid() 
      AND viewer_profile.role = 'goer'
    )
    AND profiles.role = 'maker'
    AND (
      EXISTS (
        SELECT 1 FROM public.profile_settings ps 
        WHERE ps.maker_id = profiles.user_id 
        AND (ps.show_about = true OR ps.show_on_map = true OR ps.show_portfolio = true OR ps.show_events = true)
      )
    )
  )
);

-- Ensure goers can read public events
CREATE POLICY "goers_can_read_public_events" ON public.events_market
FOR SELECT USING (
  auth.uid() IS NOT NULL AND is_public = true
);

-- Ensure goers can read published events from events table
CREATE POLICY "goers_can_read_published_events" ON public.events
FOR SELECT USING (
  auth.uid() IS NOT NULL AND is_public = true
);

-- Ensure goers CANNOT access bookings (security measure)
DROP POLICY IF EXISTS "goers_booking_access" ON public.bookings;

-- Ensure goers CANNOT access concepts (security measure) 
DROP POLICY IF EXISTS "goers_concept_access" ON public.concepts;

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