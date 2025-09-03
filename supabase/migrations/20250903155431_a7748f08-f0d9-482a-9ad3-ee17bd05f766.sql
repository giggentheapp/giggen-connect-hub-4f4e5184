-- Create RLS policies for events_market table to ensure proper data access
-- Drop existing policies first
DROP POLICY IF EXISTS "All users can view published events in market" ON public.events_market;
DROP POLICY IF EXISTS "Users can create events in market" ON public.events_market;
DROP POLICY IF EXISTS "Users can delete their own events in market" ON public.events_market;
DROP POLICY IF EXISTS "Users can update their own events in market" ON public.events_market;
DROP POLICY IF EXISTS "Users can view their own events in market" ON public.events_market;

-- Create new policies with proper access control
-- Allow all authenticated users to view only published public events (basic info only)
CREATE POLICY "Public can view published events basic info" ON public.events_market
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_public = true);

-- Allow event creators to view their own events (full access)
CREATE POLICY "Creators can view their own events" ON public.events_market
  FOR SELECT
  USING (auth.uid() = created_by);

-- Allow booking participants to view events they are involved in (via bookings table)
CREATE POLICY "Booking participants can view their events" ON public.events_market
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.status = 'published' 
      AND bookings.title = events_market.title
      AND COALESCE(bookings.venue, '') = COALESCE(events_market.venue, '')
      AND bookings.event_date::date = events_market.date
      AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
    )
  );

-- Allow users to create events in market (only booking participants should do this)
CREATE POLICY "Users can create events from bookings" ON public.events_market
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow event creators to update their own events
CREATE POLICY "Creators can update their own events" ON public.events_market
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Allow event creators to delete their own events
CREATE POLICY "Creators can delete their own events" ON public.events_market
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add expected_audience column to events_market for public display
ALTER TABLE public.events_market 
ADD COLUMN IF NOT EXISTS expected_audience integer;

-- Add datetime column for better event time handling
ALTER TABLE public.events_market 
ADD COLUMN IF NOT EXISTS event_datetime timestamp with time zone;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_market_public_date ON public.events_market(is_public, date) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_events_market_creator ON public.events_market(created_by);