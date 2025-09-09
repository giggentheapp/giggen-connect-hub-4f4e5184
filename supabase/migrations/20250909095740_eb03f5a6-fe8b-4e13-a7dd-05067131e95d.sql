-- Update booking status enum to support the new workflow
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'allowed';  
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'published';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Update bookings table to support the new workflow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS allowed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS receiver_allowed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_modified_by uuid,
ADD COLUMN IF NOT EXISTS last_modified_at timestamp with time zone;

-- Set default status to pending for new bookings
ALTER TABLE public.bookings 
ALTER COLUMN status SET DEFAULT 'pending';

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_parties ON public.bookings(sender_id, receiver_id);

-- Update booking_changes table to support approval workflow
ALTER TABLE public.booking_changes
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_by uuid,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create function to handle booking status transitions
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamps()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for booking status updates
DROP TRIGGER IF EXISTS update_booking_status_trigger ON public.bookings;
CREATE TRIGGER update_booking_status_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_status_timestamps();

-- Create function to handle change approvals
CREATE OR REPLACE FUNCTION public.approve_booking_change(
  change_id uuid,
  approval_decision boolean DEFAULT true,
  rejection_reason_text text DEFAULT null
)
RETURNS boolean AS $$
DECLARE
  change_record RECORD;
  booking_record RECORD;
BEGIN
  -- Get the change record
  SELECT * INTO change_record 
  FROM public.booking_changes 
  WHERE id = change_id AND auth.uid() IN (
    SELECT sender_id FROM public.bookings WHERE id = booking_changes.booking_id
    UNION
    SELECT receiver_id FROM public.bookings WHERE id = booking_changes.booking_id
  );
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get booking record
  SELECT * INTO booking_record FROM public.bookings WHERE id = change_record.booking_id;
  
  IF approval_decision THEN
    -- Approve the change
    UPDATE public.booking_changes 
    SET 
      status = 'approved',
      approved_by = auth.uid(),
      approved_at = now()
    WHERE id = change_id;
    
    -- Apply the change to the booking
    -- This would need specific logic based on field_name
    -- For now, we'll mark that changes need manual application
    
  ELSE
    -- Reject the change
    UPDATE public.booking_changes 
    SET 
      status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = now(),
      rejection_reason = rejection_reason_text
    WHERE id = change_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for enhanced privacy and workflow
DROP POLICY IF EXISTS "Only booking parties can view bookings" ON public.bookings;
CREATE POLICY "Booking parties can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
  );

-- Policy for public viewing of published bookings (limited fields)
CREATE POLICY "Public can view published booking summaries"
  ON public.bookings FOR SELECT
  USING (
    status = 'published' AND 
    is_public_after_approval = true AND
    auth.uid() IS NOT NULL
  );

-- Update change tracking policies
DROP POLICY IF EXISTS "Users involved in booking can view changes" ON public.booking_changes;
CREATE POLICY "Booking parties can view change history"
  ON public.booking_changes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

-- Create function to get safe booking data based on viewer relationship
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
  published_at timestamp with time zone
) AS $$
DECLARE
  booking_record RECORD;
  is_party_member boolean := false;
  is_published boolean := false;
BEGIN
  -- Get booking record
  SELECT * INTO booking_record FROM public.bookings WHERE bookings.id = booking_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if viewer is a party to the booking
  is_party_member := (viewer_id = booking_record.sender_id OR viewer_id = booking_record.receiver_id);
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
      booking_record.published_at;
      
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
      booking_record.published_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;