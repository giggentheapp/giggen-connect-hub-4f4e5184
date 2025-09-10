-- Add individual approval tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN approved_by_sender boolean DEFAULT false NOT NULL,
ADD COLUMN approved_by_receiver boolean DEFAULT false NOT NULL,
ADD COLUMN sender_approved_at timestamp with time zone,
ADD COLUMN receiver_approved_at timestamp with time zone;

-- Update existing approved bookings to reflect current state
UPDATE public.bookings 
SET 
  approved_by_sender = CASE WHEN sender_confirmed = true THEN true ELSE false END,
  approved_by_receiver = CASE WHEN receiver_confirmed = true THEN true ELSE false END,
  sender_approved_at = CASE WHEN sender_confirmed = true THEN approved_at ELSE NULL END,
  receiver_approved_at = CASE WHEN receiver_confirmed = true THEN approved_at ELSE NULL END
WHERE status IN ('both_parties_approved', 'upcoming');

-- Create trigger to update timestamps when approvals change
CREATE OR REPLACE FUNCTION public.update_approval_timestamps()
RETURNS trigger AS $$
BEGIN
  -- Update sender approval timestamp
  IF NEW.approved_by_sender = true AND OLD.approved_by_sender = false THEN
    NEW.sender_approved_at = COALESCE(NEW.sender_approved_at, now());
  END IF;
  
  -- Update receiver approval timestamp  
  IF NEW.approved_by_receiver = true AND OLD.approved_by_receiver = false THEN
    NEW.receiver_approved_at = COALESCE(NEW.receiver_approved_at, now());
  END IF;
  
  -- Update status based on both approvals
  IF NEW.approved_by_sender = true AND NEW.approved_by_receiver = true AND NEW.status = 'allowed' THEN
    NEW.status = 'both_parties_approved';
    NEW.both_parties_approved = true;
    NEW.approved_at = COALESCE(NEW.approved_at, now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_approval_timestamps
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_approval_timestamps();