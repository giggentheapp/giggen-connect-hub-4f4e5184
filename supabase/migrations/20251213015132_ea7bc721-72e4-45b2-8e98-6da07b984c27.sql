-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Only owners can access tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Only owners can view their tech specs" ON public.profile_tech_specs;

-- Create new SELECT policy that allows public viewing via published concepts
CREATE POLICY "Users can view own tech specs or via published concepts" 
ON public.profile_tech_specs 
FOR SELECT 
USING (
  -- Owner can always view their own tech specs
  (auth.uid() = profile_id)
  OR
  -- Anyone authenticated can view if tech spec is referenced in a published concept
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.concepts 
      WHERE concepts.tech_spec_reference = profile_tech_specs.id
      AND concepts.is_published = true
    )
  )
  OR
  -- Also check user_files table in case tech_spec_reference points there
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.concepts c
      JOIN public.user_files uf ON c.tech_spec_reference = uf.id
      WHERE uf.id = profile_tech_specs.id
      AND c.is_published = true
    )
  )
);