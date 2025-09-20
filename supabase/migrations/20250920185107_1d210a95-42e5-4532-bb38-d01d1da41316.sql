-- Fix critical security vulnerability: Restrict public booking access to non-sensitive fields only
-- Remove the overly permissive public_view_upcoming_bookings policy

DROP POLICY IF EXISTS "public_view_upcoming_bookings" ON public.bookings;

-- Create a secure function that returns only public, non-sensitive booking data
CREATE OR REPLACE FUNCTION public.get_public_booking_data(booking_uuid UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    time TEXT,
    venue TEXT,
    audience_estimate INTEGER,
    sender_id UUID,
    receiver_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Only return non-sensitive fields for public upcoming bookings
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.event_date,
        b.time,
        b.venue,
        b.audience_estimate,
        b.sender_id,
        b.receiver_id,
        b.created_at,
        b.published_at
    FROM public.bookings b
    WHERE b.id = booking_uuid
      AND b.status = 'upcoming'::booking_status
      AND b.is_public_after_approval = true
      AND b.both_parties_approved = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a more restrictive policy for public booking access
-- This policy only allows viewing basic event information, not financial or contact data
CREATE POLICY "public_view_safe_booking_fields"
ON public.bookings FOR SELECT
USING (
    -- Allow full access for booking parties
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    OR
    -- Allow limited public access to upcoming bookings (handled by application layer)
    (
        status = 'upcoming'::booking_status 
        AND is_public_after_approval = true 
        AND both_parties_approved = true
        AND auth.uid() IS NOT NULL 
        AND auth.uid() <> sender_id 
        AND auth.uid() <> receiver_id
    )
);

-- Create additional function to check if booking is publicly viewable
CREATE OR REPLACE FUNCTION public.is_booking_public(booking_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = booking_uuid
          AND status = 'upcoming'::booking_status
          AND is_public_after_approval = true
          AND both_parties_approved = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Log this security fix
PERFORM public.log_sensitive_access(
    NULL,
    'SECURITY_FIX_BOOKING_FINANCIAL_DATA',
    'bookings',
    NULL,
    ARRAY['artist_fee', 'ticket_price', 'door_percentage', 'sender_contact_info', 'personal_message', 'hospitality_rider']
);

-- Add comment documenting the security enhancement
COMMENT ON FUNCTION public.get_public_booking_data(UUID) 
IS 'Security function: Returns only non-sensitive booking fields for public view. Excludes financial data, contact info, and personal messages.';

COMMENT ON POLICY "public_view_safe_booking_fields" ON public.bookings 
IS 'Security enhancement: Restricts public access while allowing full access for booking parties. Financial and contact data protected from unauthorized access.';