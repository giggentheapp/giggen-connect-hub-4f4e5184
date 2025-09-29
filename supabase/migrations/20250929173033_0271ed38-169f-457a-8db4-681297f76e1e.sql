-- Drop existing conflicting policies for profile_portfolio viewing
DROP POLICY IF EXISTS "goers_can_view_allowed_portfolios" ON public.profile_portfolio;
DROP POLICY IF EXISTS "portfolio_owner_all" ON public.profile_portfolio;

-- Allow owners to manage their own portfolio files
CREATE POLICY "owners_full_access_portfolio"
ON public.profile_portfolio
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view portfolio files if maker has enabled portfolio visibility
CREATE POLICY "authenticated_can_view_public_portfolios"
ON public.profile_portfolio
FOR SELECT
TO authenticated
USING (
  -- Owner can always see their own files
  auth.uid() = user_id
  OR
  -- Other users can see if file is public AND maker has enabled portfolio visibility
  (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.profile_settings ps
      WHERE ps.maker_id = profile_portfolio.user_id
        AND ps.show_portfolio = true
    )
  )
);