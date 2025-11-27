-- Drop the existing update policy
DROP POLICY IF EXISTS "Band admins can update" ON public.bands;

-- Recreate the update policy with explicit WITH CHECK clause
CREATE POLICY "Band admins can update" 
ON public.bands
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM band_members
    WHERE band_members.band_id = bands.id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM band_members
    WHERE band_members.band_id = bands.id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
  )
);