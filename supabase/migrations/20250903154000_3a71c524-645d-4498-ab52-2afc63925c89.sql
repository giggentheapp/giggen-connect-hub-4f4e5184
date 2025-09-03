-- Remove mode switching fields from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS default_mode,
DROP COLUMN IF EXISTS current_mode;

-- Ensure RLS policies are properly configured for simplified role system
-- (The existing policies should already be correct since they use role field)