-- Drop the old unique constraint that prevents re-inviting users
ALTER TABLE band_invites 
DROP CONSTRAINT IF EXISTS band_invites_band_id_invited_user_id_key;

-- Add a partial unique constraint that only prevents duplicate PENDING invites
CREATE UNIQUE INDEX band_invites_unique_pending 
ON band_invites (band_id, invited_user_id) 
WHERE status = 'pending';