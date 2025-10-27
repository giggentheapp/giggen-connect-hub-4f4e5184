-- Insert missing profile_settings for all musicians who don't have settings yet
INSERT INTO profile_settings (maker_id, show_public_profile, show_on_map)
SELECT 
  p.user_id,
  true,
  true
FROM profiles p
WHERE p.role = 'musician'
AND NOT EXISTS (
  SELECT 1 FROM profile_settings ps WHERE ps.maker_id = p.user_id
);

-- Verify all musicians now have settings
SELECT COUNT(*) as musicians_with_settings
FROM profiles p
JOIN profile_settings ps ON p.user_id = ps.maker_id
WHERE p.role = 'musician';