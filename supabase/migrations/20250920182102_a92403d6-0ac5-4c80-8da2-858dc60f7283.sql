-- Fix critical security issue: Restrict profile_settings access to owners only
-- and create secure function for visibility checks

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view public visibility settings" ON public.profile_settings;

-- Create a restrictive policy that only allows users to see their own settings
CREATE POLICY "Users can only view their own settings" 
ON public.profile_settings 
FOR SELECT 
USING (auth.uid() = maker_id);

-- The existing get_profile_visibility function already provides secure access
-- to visibility settings without exposing API tokens, so we don't need to change it

-- Add a comment to document the security fix
COMMENT ON POLICY "Users can only view their own settings" ON public.profile_settings 
IS 'Security fix: Prevents exposure of privacy settings and API tokens to unauthorized users';