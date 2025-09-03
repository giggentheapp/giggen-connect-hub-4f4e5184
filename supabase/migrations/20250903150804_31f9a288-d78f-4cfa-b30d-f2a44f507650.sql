-- Update RLS policies for proper role-based access control

-- First, drop existing policies that conflict with new role structure
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;

-- Profiles: Public fields readable by all authenticated users, private fields only by owner
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Profile Portfolio Files: Only visible via profile viewing if owner has made portfolio public
DROP POLICY IF EXISTS "Users can view public portfolio files with correct settings" ON public.profile_portfolio;
CREATE POLICY "Users can view public portfolio files with correct settings" 
ON public.profile_portfolio 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    is_public = true 
    AND EXISTS (
      SELECT 1 FROM profile_settings ps 
      WHERE ps.maker_id = profile_portfolio.user_id 
      AND ps.show_portfolio = true
    )
  )
);

-- Profile Tech Specs: Only owner (maker) can access
CREATE POLICY "Only owners can access tech specs" 
ON public.profile_tech_specs 
FOR ALL 
USING (auth.uid() = profile_id AND is_maker(auth.uid()));

-- Hospitality Riders: Only owner (maker) can access
CREATE POLICY "Only owners can access hospitality riders" 
ON public.hospitality_riders 
FOR ALL 
USING (auth.uid() = user_id AND is_maker(auth.uid()));

-- Concepts: Only makers can view concepts
DROP POLICY IF EXISTS "Everyone can view concepts" ON public.concepts;
CREATE POLICY "Only makers can view concepts" 
ON public.concepts 
FOR SELECT 
USING (is_maker(auth.uid()));

-- Concept Files: Only makers can view via concept details
DROP POLICY IF EXISTS "Users can view concept files from published concepts" ON public.concept_files;
CREATE POLICY "Only makers can view concept files" 
ON public.concept_files 
FOR SELECT 
USING (
  is_maker(auth.uid()) 
  AND (
    auth.uid() = creator_id 
    OR EXISTS (
      SELECT 1 FROM concepts 
      WHERE concepts.id = concept_files.concept_id 
      AND concepts.is_published = true
    )
  )
);

-- Bookings: Only involved makers can access
DROP POLICY IF EXISTS "Users can view bookings they are involved in" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings as sender" ON public.bookings;
DROP POLICY IF EXISTS "Involved users can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Involved users can delete bookings" ON public.bookings;

CREATE POLICY "Only makers involved in booking can view" 
ON public.bookings 
FOR SELECT 
USING (
  is_maker(auth.uid()) 
  AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

CREATE POLICY "Only makers can create bookings as sender" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  is_maker(auth.uid()) 
  AND auth.uid() = sender_id
);

CREATE POLICY "Only involved makers can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  is_maker(auth.uid()) 
  AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

CREATE POLICY "Only involved makers can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (
  is_maker(auth.uid()) 
  AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

-- Events: All authenticated users can read published events
DROP POLICY IF EXISTS "Everyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Makers can view their own events" ON public.events;

CREATE POLICY "All users can view published public events" 
ON public.events 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_public = true);

CREATE POLICY "Makers can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = maker_id AND is_maker(auth.uid()));

-- Events Market: All authenticated users can read published events
DROP POLICY IF EXISTS "Everyone can view public events in market" ON public.events_market;
CREATE POLICY "All users can view published events in market" 
ON public.events_market 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_public = true);

-- Booking Changes: Only involved makers can access
DROP POLICY IF EXISTS "Users can view changes for their bookings" ON public.booking_changes;
DROP POLICY IF EXISTS "Users can create changes for their bookings" ON public.booking_changes;
DROP POLICY IF EXISTS "Users can update changes for their bookings" ON public.booking_changes;

CREATE POLICY "Only makers involved can view booking changes" 
ON public.booking_changes 
FOR SELECT 
USING (
  is_maker(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);

CREATE POLICY "Only makers involved can create booking changes" 
ON public.booking_changes 
FOR INSERT 
WITH CHECK (
  is_maker(auth.uid()) 
  AND auth.uid() = changed_by 
  AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);

CREATE POLICY "Only makers involved can update booking changes" 
ON public.booking_changes 
FOR UPDATE 
USING (
  is_maker(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);