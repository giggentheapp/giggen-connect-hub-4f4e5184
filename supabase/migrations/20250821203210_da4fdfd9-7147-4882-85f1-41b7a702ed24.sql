-- Fix the foreign key constraint to reference profiles.id instead of profiles.user_id
ALTER TABLE profile_settings 
DROP CONSTRAINT IF EXISTS profile_settings_maker_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE profile_settings 
ADD CONSTRAINT profile_settings_maker_id_fkey 
FOREIGN KEY (maker_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Temporarily disable RLS on profile_settings for the migration
ALTER TABLE profile_settings DISABLE ROW LEVEL SECURITY;

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