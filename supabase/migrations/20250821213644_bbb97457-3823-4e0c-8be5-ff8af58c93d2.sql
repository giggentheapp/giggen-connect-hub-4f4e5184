-- Add is_address_public field to profiles table
ALTER TABLE profiles 
ADD COLUMN is_address_public boolean NOT NULL DEFAULT false;

-- Set existing maker with address to public for testing
UPDATE profiles 
SET is_address_public = true 
WHERE role = 'maker' AND address IS NOT NULL;