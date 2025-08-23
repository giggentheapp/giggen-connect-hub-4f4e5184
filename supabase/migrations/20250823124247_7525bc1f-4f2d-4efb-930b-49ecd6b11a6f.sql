-- ========================================
-- Profil-filer (koblet til bruker/profil)
-- ========================================
CREATE TABLE IF NOT EXISTS profile_files (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profile_files
ALTER TABLE profile_files ENABLE ROW LEVEL SECURITY;

-- Bruker kan kun se sine egne filer
CREATE POLICY "Users can view own profile files"
ON profile_files FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Bruker kan kun legge til filer for seg selv
CREATE POLICY "Users can insert own profile files"
ON profile_files FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Bruker kan oppdatere egne filer
CREATE POLICY "Users can update own profile files"
ON profile_files FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Bruker kan slette egne filer
CREATE POLICY "Users can delete own profile files"
ON profile_files FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ========================================
-- Update concept_files to match new structure
-- ========================================

-- Add file_url column if it doesn't exist
ALTER TABLE concept_files 
ADD COLUMN IF NOT EXISTS file_url TEXT;