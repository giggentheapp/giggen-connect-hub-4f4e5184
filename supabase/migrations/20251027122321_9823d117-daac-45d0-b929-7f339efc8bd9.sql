-- Fix profiles RLS policy to allow avatar updates

-- Drop the restrictive update policies
DROP POLICY IF EXISTS "Artists can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Audience can update profile except avatar" ON profiles;

-- Create a single, comprehensive update policy for all users
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);