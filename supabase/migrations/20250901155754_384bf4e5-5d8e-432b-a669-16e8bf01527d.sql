-- Add foreign key constraint to favorites table for proper joins
ALTER TABLE public.favorites 
ADD CONSTRAINT fk_favorites_item_id_profiles 
FOREIGN KEY (item_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;