-- Fix the has_active_booking_with_user function to use correct enum values
CREATE OR REPLACE FUNCTION public.has_active_booking_with_user(target_user_id uuid, viewer_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE status IN ('allowed', 'both_parties_approved', 'upcoming')
    AND (
      (sender_id = viewer_user_id AND receiver_id = target_user_id) OR
      (sender_id = target_user_id AND receiver_id = viewer_user_id)
    )
  );
END;
$function$