-- Drop foreign key constraint temporarily to clean up orphaned data
ALTER TABLE profile_settings DROP CONSTRAINT profile_settings_maker_id_fkey;

-- Delete orphaned profile_settings records
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
  AND id NOT IN (SELECT COALESCE(maker_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM profile_settings);

-- Re-create the foreign key constraint
ALTER TABLE profile_settings 
ADD CONSTRAINT profile_settings_maker_id_fkey 
FOREIGN KEY (maker_id) REFERENCES profiles(id) ON DELETE CASCADE;