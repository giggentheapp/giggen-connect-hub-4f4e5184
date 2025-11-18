-- Fix handle_new_user trigger to create valid username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the part before @ as username (e.g., "user" from "user@example.com")
  INSERT INTO public.profiles (user_id, username, display_name, role)
  VALUES (
    NEW.id, 
    split_part(NEW.email, '@', 1), -- username = part before @
    split_part(NEW.email, '@', 1), -- display_name = part before @
    'musician'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;