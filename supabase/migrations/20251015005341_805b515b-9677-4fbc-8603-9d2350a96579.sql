-- Fix search_path for update_notifications_updated_at function
DROP TRIGGER IF EXISTS update_notifications_timestamp ON public.notifications;
DROP FUNCTION IF EXISTS public.update_notifications_updated_at();

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();