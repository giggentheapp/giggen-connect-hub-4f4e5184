-- Remove conflicting RESTRICTIVE policies that duplicate functionality
-- The concepts_all_own policy already handles owner access, so we don't need
-- the additional is_artist() check policies

-- Drop the problematic UPDATE policy (concepts_all_own already handles this)
DROP POLICY IF EXISTS "Only concept owners can update their concepts" ON concepts;

-- Drop the problematic DELETE policy (concepts_all_own already handles this)
DROP POLICY IF EXISTS "Only concept owners can delete their concepts" ON concepts;

-- Drop the problematic SELECT policy (concepts_select_own_or_published already handles this)
DROP POLICY IF EXISTS "Only artists can view concepts" ON concepts;

-- Drop the problematic INSERT policy (concepts_all_own already handles this)
DROP POLICY IF EXISTS "Only artists can create concepts" ON concepts;

-- Ensure is_artist function includes all relevant roles (for any remaining policies that use it)
CREATE OR REPLACE FUNCTION public.is_artist(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_uuid
      AND role::text IN ('artist', 'musician', 'organizer')
  )
$$;