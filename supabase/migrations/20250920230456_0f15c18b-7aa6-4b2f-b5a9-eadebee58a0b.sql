-- Add privacy settings to profiles table for Maker visibility control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "show_profile_to_goers": true,
  "show_portfolio_to_goers": true,
  "show_events_to_goers": true,
  "show_contact_info_to_goers": false,
  "show_pricing_to_goers": false
}';

-- Update existing maker profiles to have default privacy settings
UPDATE profiles 
SET privacy_settings = '{
  "show_profile_to_goers": true,
  "show_portfolio_to_goers": true,
  "show_events_to_goers": true,
  "show_contact_info_to_goers": false,
  "show_pricing_to_goers": false
}'
WHERE role = 'maker' AND privacy_settings IS NULL;

-- Create a simple RLS policy for Goers to view Makers with allowed privacy settings
CREATE POLICY "goers_can_view_public_makers" ON profiles
FOR SELECT USING (
  role = 'maker' 
  AND (privacy_settings->>'show_profile_to_goers')::boolean = true
  AND auth.uid() IS NOT NULL
);