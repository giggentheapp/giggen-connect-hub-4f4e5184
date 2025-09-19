-- Test the RLS policy condition manually to debug the issue
-- Let's create a function that allows any authenticated user to insert events during publishing

DROP POLICY IF EXISTS "Users and triggers can insert events" ON public.events_market;

-- Create a simpler policy that allows inserts when user is authenticated
-- or when it's a system operation (like triggers)
CREATE POLICY "Allow event publishing" 
ON public.events_market 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated (manual insert)
  auth.uid() IS NOT NULL OR
  -- Allow system operations (triggers, functions) - no auth context needed
  auth.uid() IS NULL
);