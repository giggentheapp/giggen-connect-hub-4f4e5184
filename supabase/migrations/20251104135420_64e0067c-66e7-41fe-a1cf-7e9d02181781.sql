-- Add notifications_band_invites column to profile_settings table
ALTER TABLE profile_settings
ADD COLUMN IF NOT EXISTS notifications_band_invites BOOLEAN DEFAULT true;