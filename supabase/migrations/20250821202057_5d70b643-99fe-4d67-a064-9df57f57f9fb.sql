-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing profile update policy to recreate it with maker restriction
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that only allows makers to update avatar_url
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- If updating avatar_url, user must be a maker
  (
    (NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND is_maker(auth.uid())) OR
    (NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url)
  )
);

-- Create policy for makers to update only their own profile completely
CREATE POLICY "Makers can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND is_maker(auth.uid()))
WITH CHECK (auth.uid() = user_id AND is_maker(auth.uid()));

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);