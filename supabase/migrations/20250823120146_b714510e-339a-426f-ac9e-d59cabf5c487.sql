-- 1. Legg til title + description i concept_files hvis de ikke finnes
ALTER TABLE concept_files
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Sørg for at portfolio også har description (du hadde title allerede)
ALTER TABLE portfolio
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Oppdater RLS-policyene for concept_files (samme som portfolio)
-- Drop existing restrictive policies first
DROP POLICY IF EXISTS "Makers can view their own concept files" ON concept_files;
DROP POLICY IF EXISTS "Only concept owners can delete their files" ON concept_files;
DROP POLICY IF EXISTS "Only concept owners can update their files" ON concept_files;
DROP POLICY IF EXISTS "Only makers can create concept files" ON concept_files;
DROP POLICY IF EXISTS "Users can view public concept files" ON concept_files;

-- Tillat brukere å opprette egne filer
CREATE POLICY "Users can insert own concept_files" ON concept_files
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Tillat brukere å lese egne filer
CREATE POLICY "Users can view own concept_files" ON concept_files
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Tillat brukere å oppdatere egne filer
CREATE POLICY "Users can update own concept_files" ON concept_files
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tillat brukere å slette egne filer
CREATE POLICY "Users can delete own concept_files" ON concept_files
FOR DELETE TO authenticated
USING (auth.uid() = user_id);