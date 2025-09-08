-- First, update RLS policies for bookings to implement strict privacy controls
DROP POLICY IF EXISTS "Only makers involved in booking can view" ON public.bookings;
DROP POLICY IF EXISTS "Only involved makers can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Only involved makers can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Only makers can create bookings as sender" ON public.bookings;

-- Create new comprehensive RLS policies for bookings
CREATE POLICY "Only booking parties can view bookings" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

CREATE POLICY "Only booking parties can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

CREATE POLICY "Only makers can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = sender_id AND 
  is_maker(auth.uid())
);

CREATE POLICY "Only booking parties can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

-- Add new fields to bookings table for enhanced privacy and workflow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_public_after_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_visibility_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS agreement_summary_text TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS contact_info_shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS both_parties_approved BOOLEAN GENERATED ALWAYS AS (sender_confirmed AND receiver_confirmed) STORED;

-- Create function to clean sensitive data when booking is deleted
CREATE OR REPLACE FUNCTION public.clean_booking_sensitive_data(booking_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update booking to remove sensitive data
  UPDATE public.bookings 
  SET 
    sender_contact_info = NULL,
    personal_message = NULL,
    price_musician = NULL,
    artist_fee = NULL,
    hospitality_rider = NULL,
    hospitality_rider_status = 'not_provided',
    contact_info_shared_at = NULL,
    -- Keep only basic metadata
    description = CASE 
      WHEN status = 'deleted' THEN 'Booking slettet - sensitiv data fjernet'
      ELSE description 
    END
  WHERE id = booking_uuid;
  
  -- Delete related booking changes
  UPDATE public.booking_changes 
  SET 
    old_value = '[SLETTET]',
    new_value = '[SLETTET]'
  WHERE booking_id = booking_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get public booking info based on privacy settings
CREATE OR REPLACE FUNCTION public.get_public_booking_info(booking_uuid UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_time TEXT,
  venue TEXT,
  ticket_price NUMERIC,
  expected_audience INTEGER,
  is_public BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b.description
      ELSE NULL 
    END as description,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b.event_date
      ELSE NULL 
    END as event_date,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b."time"
      ELSE NULL 
    END as event_time,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b.venue
      ELSE NULL 
    END as venue,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b.ticket_price
      ELSE NULL 
    END as ticket_price,
    CASE 
      WHEN b.both_parties_approved AND b.is_public_after_approval THEN b.audience_estimate
      ELSE NULL 
    END as expected_audience,
    b.both_parties_approved AND b.is_public_after_approval as is_public,
    b.created_at
  FROM public.bookings b
  WHERE b.id = booking_uuid 
    AND b.status IN ('confirmed', 'published')
    AND b.both_parties_approved = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update events_market policies to respect booking privacy
DROP POLICY IF EXISTS "Public can view published events basic info" ON public.events_market;
DROP POLICY IF EXISTS "Booking participants can view their events" ON public.events_market;

CREATE POLICY "Public can view published events" 
ON public.events_market 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  is_public = true
);

CREATE POLICY "Event creators can manage their events" 
ON public.events_market 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add trigger to update booking timestamps
CREATE OR REPLACE FUNCTION public.update_booking_contact_shared_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- When both parties confirm, set contact sharing timestamp
  IF NEW.both_parties_approved = true AND OLD.both_parties_approved = false THEN
    NEW.contact_info_shared_at = now();
  END IF;
  
  -- When booking is deleted, set deletion timestamp and clean data
  IF NEW.status = 'deleted' AND OLD.status != 'deleted' THEN
    NEW.deleted_at = now();
    PERFORM public.clean_booking_sensitive_data(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS booking_privacy_trigger ON public.bookings;
CREATE TRIGGER booking_privacy_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_contact_shared_timestamp();