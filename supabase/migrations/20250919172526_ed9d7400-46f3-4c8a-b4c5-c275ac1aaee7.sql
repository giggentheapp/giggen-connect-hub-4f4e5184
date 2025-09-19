-- Fix RLS policies for events_market table to resolve publishing conflicts

-- Drop conflicting policies
DROP POLICY IF EXISTS "Event creators can manage their events" ON public.events_market;
DROP POLICY IF EXISTS "Users can create events from bookings" ON public.events_market;

-- Create clean, non-conflicting policies
CREATE POLICY "Users can insert their own events" 
ON public.events_market 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" 
ON public.events_market 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" 
ON public.events_market 
FOR DELETE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own events" 
ON public.events_market 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Public can view published events" 
ON public.events_market 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_public = true);