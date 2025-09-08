-- Fix critical security issue: Replace overly permissive profiles RLS policy
-- Current policy allows anyone to see all profiles with "filtered data" but filtering isn't working properly

-- Drop the dangerous existing policy
DROP POLICY IF EXISTS "Users can view all profiles with filtered data" ON public.profiles;

-- Create restrictive policies that properly protect user data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow viewing other profiles only through secure functions that implement proper filtering
-- This prevents direct table access and forces use of get_public_profile/get_secure_profile_data functions
CREATE POLICY "Restrict direct profile access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id); -- Only own profile via direct access