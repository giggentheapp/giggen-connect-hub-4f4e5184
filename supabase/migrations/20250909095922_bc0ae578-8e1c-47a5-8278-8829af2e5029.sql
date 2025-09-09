-- Fix function search path security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamps()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update timestamps based on status changes
  IF NEW.status = 'allowed' AND OLD.status != 'allowed' THEN
    NEW.allowed_at = now();
    NEW.contact_info_shared_at = now(); -- Share contact info when allowed
  END IF;
  
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = now();
  END IF;
  
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = now();
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  -- Track who made the last modification
  NEW.last_modified_by = auth.uid();
  NEW.last_modified_at = now();
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Fix get_booking_for_viewer function search path
CREATE OR REPLACE FUNCTION public.get_booking_for_viewer(
  booking_id uuid,
  viewer_id uuid DEFAULT auth.uid()
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  status text,
  event_date timestamp with time zone,
  venue text,
  sender_id uuid,
  receiver_id uuid,
  contact_info jsonb,
  personal_message text,
  price_musician text,
  artist_fee numeric,
  hospitality_rider text,
  created_at timestamp with time zone,
  allowed_at timestamp with time zone,
  approved_at timestamp with time zone,
  published_at timestamp with time zone,
  is_viewer_sender boolean,
  is_viewer_receiver boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  is_party_member boolean := false;
  is_published boolean := false;
  is_sender boolean := false;
  is_receiver boolean := false;
BEGIN
  -- Get booking record
  SELECT * INTO booking_record FROM public.bookings WHERE bookings.id = get_booking_for_viewer.booking_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check viewer relationship to booking
  is_sender := (viewer_id = booking_record.sender_id);
  is_receiver := (viewer_id = booking_record.receiver_id);
  is_party_member := (is_sender OR is_receiver);
  is_published := (booking_record.status = 'published' AND booking_record.is_public_after_approval = true);
  
  -- Return data based on access level
  IF is_party_member THEN
    -- Full access for parties involved
    RETURN QUERY SELECT 
      booking_record.id,
      booking_record.title,
      booking_record.description,
      booking_record.status::text,
      booking_record.event_date,
      booking_record.venue,
      booking_record.sender_id,
      booking_record.receiver_id,
      CASE WHEN booking_record.status IN ('allowed', 'approved', 'published') 
           THEN booking_record.sender_contact_info 
           ELSE NULL END,
      CASE WHEN booking_record.status IN ('allowed', 'approved', 'published') 
           THEN booking_record.personal_message 
           ELSE NULL END,
      booking_record.price_musician,
      booking_record.artist_fee,
      CASE WHEN booking_record.status IN ('allowed', 'approved', 'published') 
           THEN booking_record.hospitality_rider 
           ELSE NULL END,
      booking_record.created_at,
      booking_record.allowed_at,
      booking_record.approved_at,
      booking_record.published_at,
      is_sender,
      is_receiver;
      
  ELSIF is_published THEN
    -- Limited public access for published bookings
    RETURN QUERY SELECT 
      booking_record.id,
      booking_record.title,
      booking_record.description,
      'published'::text,
      booking_record.event_date,
      booking_record.venue,
      booking_record.sender_id,
      booking_record.receiver_id,
      NULL::jsonb, -- No contact info
      NULL::text,  -- No personal message
      NULL::text,  -- No price info
      NULL::numeric, -- No fee info
      NULL::text,  -- No hospitality rider
      booking_record.created_at,
      NULL::timestamp with time zone, -- No internal timestamps
      NULL::timestamp with time zone,
      booking_record.published_at,
      false, -- Not sender
      false; -- Not receiver
  END IF;
END;
$$;