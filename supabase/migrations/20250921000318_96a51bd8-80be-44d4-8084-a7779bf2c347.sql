-- Create a new RLS policy for Goers to view portfolios based on privacy settings
-- This policy checks the privacy_settings JSONB field in the profiles table
CREATE POLICY "goers_can_view_allowed_portfolios" ON public.profile_portfolio
FOR SELECT 
TO authenticated
USING (
  -- Own portfolio always visible
  auth.uid() = user_id
  OR
  -- Public portfolio visible if maker allows Goers to see it
  (
    is_public = true 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = profile_portfolio.user_id
      AND p.role = 'maker'
      AND (p.privacy_settings->>'show_portfolio_to_goers')::boolean = true
    )
  )
);

-- Drop the old conflicting policies that reference profile_settings table
DROP POLICY IF EXISTS "Users can view public portfolio files with correct settings" ON public.profile_portfolio;
DROP POLICY IF EXISTS "portfolio_public_read" ON public.profile_portfolio;