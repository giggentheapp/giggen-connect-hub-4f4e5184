
-- Set all portfolio files to public for organizers
UPDATE user_files
SET is_public = true
WHERE id IN (
  SELECT fu.file_id 
  FROM file_usage fu
  WHERE fu.usage_type = 'profile_portfolio'
    AND fu.reference_id IN (
      SELECT user_id 
      FROM profiles 
      WHERE role = 'organizer'
    )
);