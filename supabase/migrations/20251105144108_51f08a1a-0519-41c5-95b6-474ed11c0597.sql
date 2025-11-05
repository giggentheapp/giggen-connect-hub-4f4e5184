-- Allow users to view bands they have been invited to
CREATE POLICY "Users can view bands they are invited to"
ON public.bands
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM band_invites
    WHERE band_invites.band_id = bands.id
    AND band_invites.invited_user_id = auth.uid()
    AND band_invites.status = 'pending'
  )
);