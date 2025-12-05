-- Update is_artist function to include organizer and musician roles
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
      AND role IN ('artist', 'musician', 'organizer')
  )
$$;