-- Fix the foreign key constraint and data consistency
ALTER TABLE profile_settings DROP CONSTRAINT profile_settings_maker_id_fkey;

-- Update existing profile_settings to use user_id instead of profile.id
UPDATE profile_settings 
SET maker_id = p.user_id
FROM profiles p 
WHERE profile_settings.maker_id = p.id;

-- Add the correct foreign key constraint to reference profiles.user_id
ALTER TABLE profile_settings 
ADD CONSTRAINT profile_settings_maker_id_fkey 
FOREIGN KEY (maker_id) REFERENCES profiles(user_id) ON DELETE CASCADE;