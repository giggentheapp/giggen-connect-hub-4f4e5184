-- Ensure the concepts_all_own policy has proper WITH CHECK for INSERT operations
-- Drop and recreate with explicit WITH CHECK clause

DROP POLICY IF EXISTS "concepts_all_own" ON concepts;

CREATE POLICY "concepts_all_own" ON concepts
  FOR ALL
  TO authenticated
  USING (auth.uid() = maker_id)
  WITH CHECK (auth.uid() = maker_id);

-- Also ensure there's no restrictive policy blocking inserts
-- Verify is_artist function works correctly
SELECT is_artist(auth.uid()) as test_is_artist;