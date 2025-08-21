-- Temporarily disable RLS on profile_settings for cleanup
ALTER TABLE profile_settings DISABLE ROW LEVEL SECURITY;

-- Delete orphaned profile_settings records that reference non-existent profiles
DELETE FROM profile_settings 
WHERE maker_id NOT IN (SELECT id FROM profiles);

-- Create profile_settings for existing makers who don't have them
INSERT INTO profile_settings (maker_id, show_on_map, show_about, show_contact, show_events, show_portfolio, show_techspec)
SELECT 
  id as maker_id,
  false as show_on_map,
  false as show_about,
  false as show_contact,
  false as show_events,
  false as show_portfolio,
  false as show_techspec
FROM profiles 
WHERE role = 'maker' 
  AND id NOT IN (SELECT maker_id FROM profile_settings WHERE maker_id IS NOT NULL);

-- Re-enable RLS on profile_settings
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;