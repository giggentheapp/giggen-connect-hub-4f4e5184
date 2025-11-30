-- Create trigger function to auto-create profile_settings when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default profile settings for the new profile
  INSERT INTO public.profile_settings (
    maker_id,
    show_public_profile,
    show_contact,
    show_on_map,
    show_about,
    show_portfolio,
    show_techspec,
    show_events,
    notifications_booking_requests,
    notifications_band_invites
  )
  VALUES (
    NEW.user_id,
    false,  -- Default to false, user must explicitly opt-in
    true,   -- Show contact by default
    false,  -- Don't show on map by default
    true,   -- Show about section
    true,   -- Show portfolio
    true,   -- Show tech specs
    true,   -- Show events
    true,   -- Enable booking request notifications
    true    -- Enable band invite notifications
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after a profile is inserted
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();