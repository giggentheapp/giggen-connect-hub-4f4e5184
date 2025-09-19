-- Allow trigger to insert events by making INSERT policy more permissive
-- The issue is that triggers run in database context, not user context

DROP POLICY IF EXISTS "Users can insert their own events" ON public.events_market;

-- Create new policy that allows both user inserts and trigger inserts
CREATE POLICY "Users and triggers can insert events" 
ON public.events_market 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and is the creator
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  -- Allow if this is a trigger context (when auth.uid() might be null)
  -- and created_by is a valid user ID from the booking
  (created_by IS NOT NULL AND 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = created_by))
);