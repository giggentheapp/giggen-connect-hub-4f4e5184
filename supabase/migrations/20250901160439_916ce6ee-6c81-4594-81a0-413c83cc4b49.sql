-- Insert test data for favorites to verify the system works
-- First, let's add some test favorite makers for the current user
INSERT INTO public.favorites (user_id, item_id, item_type) 
SELECT 
  '6a72cd9c-90b6-4a50-9ef8-78382cc61c72' as user_id,
  p.user_id as item_id,
  'maker' as item_type
FROM public.profiles p 
WHERE p.role = 'maker' 
  AND p.user_id != '6a72cd9c-90b6-4a50-9ef8-78382cc61c72'
LIMIT 2
ON CONFLICT (user_id, item_id, item_type) DO NOTHING;