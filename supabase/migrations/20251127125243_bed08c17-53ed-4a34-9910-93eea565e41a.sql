-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create bands" ON public.bands;

-- Recreate insert policy with TO authenticated clause
CREATE POLICY "Users can create bands" 
ON public.bands
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also ensure the band admins delete policy has TO authenticated
DROP POLICY IF EXISTS "Band admins can delete" ON public.bands;

CREATE POLICY "Band admins can delete" 
ON public.bands
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM band_members
    WHERE band_members.band_id = bands.id
      AND band_members.user_id = auth.uid()
      AND band_members.role = 'founder'
  )
);