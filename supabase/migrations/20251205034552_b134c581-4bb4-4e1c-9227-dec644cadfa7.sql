-- Fix is_artist function to include all relevant roles
CREATE OR REPLACE FUNCTION public.is_artist(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_uuid
      AND role IN ('artist', 'musician', 'organizer')
  )
$$;

-- Update UPDATE policy to allow organizers and musicians
DROP POLICY IF EXISTS "Only concept owners can update their concepts" ON concepts;

CREATE POLICY "Only concept owners can update their concepts"
ON concepts FOR UPDATE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

-- Update DELETE policy to allow organizers and musicians  
DROP POLICY IF EXISTS "Only concept owners can delete their concepts" ON concepts;

CREATE POLICY "Only concept owners can delete their concepts"
ON concepts FOR DELETE
TO authenticated
USING (auth.uid() = maker_id AND is_artist(auth.uid()));

-- Update SELECT policy - keep existing permissive ones but ensure artists policy works
DROP POLICY IF EXISTS "Only artists can view concepts" ON concepts;

CREATE POLICY "Only artists can view concepts"
ON concepts FOR SELECT
TO authenticated
USING (is_artist(auth.uid()));

-- Update INSERT policy
DROP POLICY IF EXISTS "Only artists can create concepts" ON concepts;

CREATE POLICY "Only artists can create concepts"
ON concepts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = maker_id AND is_artist(auth.uid()));