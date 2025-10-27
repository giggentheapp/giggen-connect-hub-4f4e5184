-- Drop the restrictive policy that limits profile visibility
DROP POLICY IF EXISTS "public_can_view_basic_artist_profiles" ON profiles;

-- Create a new policy that allows all authenticated users to view all profiles
CREATE POLICY "authenticated_users_can_view_all_profiles"
ON profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Verify the change
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';