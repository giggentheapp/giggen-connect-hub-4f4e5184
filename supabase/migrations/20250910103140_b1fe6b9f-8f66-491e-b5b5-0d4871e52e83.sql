-- Allow users to view public visibility settings of other makers
-- This is needed for ProfileModal to check if portfolio should be visible
CREATE POLICY "Users can view public visibility settings"
ON profile_settings
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive policy that was blocking public visibility checks
DROP POLICY "Makers can view their own settings" ON profile_settings;