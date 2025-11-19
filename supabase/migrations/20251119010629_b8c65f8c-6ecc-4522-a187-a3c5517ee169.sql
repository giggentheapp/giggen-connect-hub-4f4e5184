
-- Fix security functions to have proper search_path set
-- This prevents potential SQL injection attacks

-- Fix is_artist function
CREATE OR REPLACE FUNCTION public.is_artist(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = user_uuid
      AND role = 'artist'
  );
$$;

-- Fix is_file_in_portfolio function  
CREATE OR REPLACE FUNCTION public.is_file_in_portfolio(file_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_portfolio
    WHERE id = file_uuid
      AND is_public = true
  );
$$;

-- Fix has_active_booking_with_user function
CREATE OR REPLACE FUNCTION public.has_active_booking_with_user(
  target_user_id uuid,
  viewer_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE (
      (sender_id = viewer_user_id AND receiver_id = target_user_id)
      OR (sender_id = target_user_id AND receiver_id = viewer_user_id)
    )
    AND status IN ('allowed', 'both_parties_approved', 'upcoming')
    AND deleted_at IS NULL
  );
$$;
