-- Update bookings table with new fields
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS time TEXT,
ADD COLUMN IF NOT EXISTS audience_estimate INTEGER,
ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS artist_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS personal_message TEXT,
ADD COLUMN IF NOT EXISTS hospitality_rider_status TEXT DEFAULT 'not_provided';

-- Update the booking_changes table structure
DROP TABLE IF EXISTS public.booking_changes;

CREATE TABLE public.booking_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking_changes
ALTER TABLE public.booking_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_changes
CREATE POLICY "Users involved in booking can view changes" 
ON public.booking_changes 
FOR SELECT 
USING (
  is_maker(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users involved in booking can create changes" 
ON public.booking_changes 
FOR INSERT 
WITH CHECK (
  is_maker(auth.uid()) AND 
  auth.uid() = changed_by AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users involved in booking can update changes" 
ON public.booking_changes 
FOR UPDATE 
USING (
  is_maker(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_changes.booking_id 
    AND (bookings.sender_id = auth.uid() OR bookings.receiver_id = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_booking_changes_updated_at
BEFORE UPDATE ON public.booking_changes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for booking_changes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_changes;
ALTER TABLE public.booking_changes REPLICA IDENTITY FULL;