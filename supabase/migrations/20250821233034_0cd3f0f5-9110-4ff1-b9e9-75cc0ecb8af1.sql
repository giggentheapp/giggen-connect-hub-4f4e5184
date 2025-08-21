CREATE TABLE profile_images (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;

-- INSERT: brukeren kan legge til sitt eget profilbilde
CREATE POLICY "Insert own profile image"
ON profile_images
FOR INSERT
USING (auth.uid() IS NOT NULL)
WITH CHECK (user_id = auth.uid());

-- SELECT: brukeren kan hente sitt eget profilbilde
CREATE POLICY "Select own profile image"
ON profile_images
FOR SELECT
USING (user_id = auth.uid());

-- UPDATE: brukeren kan oppdatere sitt eget profilbilde
CREATE POLICY "Update own profile image"
ON profile_images
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: brukeren kan slette sitt eget profilbilde
CREATE POLICY "Delete own profile image"
ON profile_images
FOR DELETE
USING (user_id = auth.uid());