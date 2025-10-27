-- Update all profiles to have role 'musician'
UPDATE profiles 
SET role = 'musician'
WHERE role IN ('organizer', 'artist', 'audience');

-- Verify the update
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;