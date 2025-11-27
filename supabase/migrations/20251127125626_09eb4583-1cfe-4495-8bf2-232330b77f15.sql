-- Create helper function to check if user can create bands
CREATE OR REPLACE FUNCTION public.can_create_band(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id IS NOT NULL AND user_id = auth.uid();
$$;

-- Drop and recreate the insert policy using the helper function
DROP POLICY IF EXISTS "Users can create bands" ON public.bands;

CREATE POLICY "Users can create bands" 
ON public.bands
FOR INSERT 
TO authenticated
WITH CHECK (public.can_create_band(created_by));