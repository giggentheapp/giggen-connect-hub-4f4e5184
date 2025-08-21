-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing profile update policy to recreate it with maker restriction
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Makers can update their own profile" ON public.profiles;

-- Create policy that allows makers to update their profiles (including avatar_url)
-- and allows goers to update their profiles but NOT avatar_url
CREATE POLICY "Makers can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND is_maker(auth.uid()))
WITH CHECK (auth.uid() = user_id AND is_maker(auth.uid()));

-- Create policy for goers (can update profile but not avatar_url)
CREATE POLICY "Goers can update profile except avatar" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_maker(auth.uid()))
WITH CHECK (auth.uid() = user_id AND NOT is_maker(auth.uid()));

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Only makers can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Only makers can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Only makers can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);