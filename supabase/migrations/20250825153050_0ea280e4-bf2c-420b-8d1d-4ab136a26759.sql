-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_ids uuid[] NOT NULL DEFAULT '{}',
  selected_concept_id uuid NULL,
  title text NOT NULL,
  description text,
  price_musician text, -- Can be amount or "spiller for døra"
  price_ticket text, -- Can be amount or "spiller for døra"  
  event_date timestamp with time zone,
  venue text,
  hospitality_rider text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'negotiating', 'confirming', 'confirmed', 'published', 'cancelled')),
  sender_confirmed boolean DEFAULT false,
  receiver_confirmed boolean DEFAULT false,
  sender_read_agreement boolean DEFAULT false,
  receiver_read_agreement boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create booking changes table for tracking edits
CREATE TABLE public.booking_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_timestamp timestamp with time zone DEFAULT now(),
  acknowledged_by_sender boolean DEFAULT false,
  acknowledged_by_receiver boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view bookings they are involved in"
ON public.bookings FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create bookings as sender"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = sender_id AND is_maker(auth.uid()));

CREATE POLICY "Involved users can update bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS policies for booking changes  
CREATE POLICY "Users can view changes for their bookings"
ON public.booking_changes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can create changes for their bookings"
ON public.booking_changes FOR INSERT
WITH CHECK (
  auth.uid() = changed_by AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can update changes for their bookings"
ON public.booking_changes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (sender_id = auth.uid() OR receiver_id = auth.uid())
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_updated_at();