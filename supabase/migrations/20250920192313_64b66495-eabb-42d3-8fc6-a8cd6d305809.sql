-- Add RLS policies to allow service role access for edge functions
-- This fixes the security issue blocking Mapbox token access

-- Allow service role (edge functions) full access to profiles table
CREATE POLICY "service_role_full_access_profiles" ON public.profiles
FOR ALL USING (auth.role() = 'service_role');

-- Allow service role access to profile_settings table (where Mapbox config might be stored)
CREATE POLICY "service_role_full_access_profile_settings" ON public.profile_settings
FOR ALL USING (auth.role() = 'service_role');

-- Allow service role access to events_market for public data
CREATE POLICY "service_role_full_access_events_market" ON public.events_market
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users basic read access to public events
CREATE POLICY "authenticated_users_read_public_events" ON public.events_market
FOR SELECT USING (auth.uid() IS NOT NULL AND is_public = true);

-- Ensure all users can read their own profile data
CREATE POLICY "users_read_own_profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Add a policy for unauthenticated access to public data (for map display)
CREATE POLICY "public_read_map_data" ON public.profiles
FOR SELECT USING (
  is_address_public = true AND 
  EXISTS (
    SELECT 1 FROM public.profile_settings ps 
    WHERE ps.maker_id = profiles.user_id 
    AND ps.show_on_map = true
  )
);