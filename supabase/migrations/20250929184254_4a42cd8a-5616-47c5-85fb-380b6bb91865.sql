-- Allow authenticated users to view profile settings (needed for public profile viewing)
DROP POLICY IF EXISTS "Users can only view their own settings" ON profile_settings;

CREATE POLICY "authenticated_can_view_profile_settings"
ON profile_settings
FOR SELECT
TO authenticated
USING (true);

-- Keep the existing policies for create/update (owners only)
-- These already exist and don't need changes