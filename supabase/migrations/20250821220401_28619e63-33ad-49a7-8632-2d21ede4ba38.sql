-- Recreate the missing profile for the current user
INSERT INTO public.profiles (user_id, display_name, role, bio)
VALUES ('28905882-8410-48bc-bf39-1bf5c2da0045', 'Peder August Halvorsen', 'maker', 'GIGGEN Maker profil')
ON CONFLICT (user_id) DO NOTHING;

-- Create profile settings for the maker
INSERT INTO public.profile_settings (maker_id, show_about, show_contact, show_portfolio, show_techspec, show_events, show_on_map)
VALUES ('28905882-8410-48bc-bf39-1bf5c2da0045', true, true, true, true, true, true)
ON CONFLICT (maker_id) DO NOTHING;