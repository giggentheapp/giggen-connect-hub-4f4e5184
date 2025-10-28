-- Add instruments column to profiles table for musicians
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instruments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.instruments IS 'Array of instruments/roles for musicians with details. Format: [{"instrument": "Vokal", "details": "Alt og tenor"}]';