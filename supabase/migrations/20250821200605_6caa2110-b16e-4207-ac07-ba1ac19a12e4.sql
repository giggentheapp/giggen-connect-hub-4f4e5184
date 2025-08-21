-- Create foreign key relationship between profile_settings and profiles
ALTER TABLE public.profile_settings 
ADD CONSTRAINT profile_settings_maker_id_fkey 
FOREIGN KEY (maker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;