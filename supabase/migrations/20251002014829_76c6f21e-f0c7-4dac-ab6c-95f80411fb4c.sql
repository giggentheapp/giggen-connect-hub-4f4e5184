-- Create table for booking portfolio attachments
CREATE TABLE public.booking_portfolio_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  portfolio_file_id UUID NOT NULL REFERENCES public.profile_portfolio(id) ON DELETE CASCADE,
  attached_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, portfolio_file_id)
);

-- Enable RLS
ALTER TABLE public.booking_portfolio_attachments ENABLE ROW LEVEL SECURITY;

-- Both parties in a booking can attach their own portfolio files
CREATE POLICY "Booking parties can attach their own portfolio files"
ON public.booking_portfolio_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = attached_by AND
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id 
    AND (b.sender_id = auth.uid() OR b.receiver_id = auth.uid())
  ) AND
  EXISTS (
    SELECT 1 FROM public.profile_portfolio pp
    WHERE pp.id = portfolio_file_id 
    AND pp.user_id = auth.uid()
    AND pp.is_public = true
  )
);

-- Both parties can view all attachments in their booking
CREATE POLICY "Booking parties can view attachments"
ON public.booking_portfolio_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id 
    AND (b.sender_id = auth.uid() OR b.receiver_id = auth.uid())
  )
);

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON public.booking_portfolio_attachments
FOR DELETE
TO authenticated
USING (auth.uid() = attached_by);

-- Create index for better query performance
CREATE INDEX idx_booking_portfolio_attachments_booking_id 
ON public.booking_portfolio_attachments(booking_id);

CREATE INDEX idx_booking_portfolio_attachments_portfolio_file_id 
ON public.booking_portfolio_attachments(portfolio_file_id);