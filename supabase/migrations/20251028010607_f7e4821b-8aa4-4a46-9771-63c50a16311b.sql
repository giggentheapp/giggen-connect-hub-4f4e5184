-- Clean up orphaned pending invites older than 30 days
-- This handles cases where invites were accepted but status wasn't updated
UPDATE band_invites
SET status = 'declined', 
    responded_at = NOW()
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '30 days'
  AND invited_user_id IN (
    SELECT user_id FROM band_members WHERE band_id = band_invites.band_id
  );

-- Also update the specific problematic invite
UPDATE band_invites
SET status = 'declined',
    responded_at = NOW()
WHERE id = '86abea8d-5a7a-44fc-83e3-c3753dcf19cf';