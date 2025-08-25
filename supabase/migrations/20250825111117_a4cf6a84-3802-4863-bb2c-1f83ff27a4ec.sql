-- Fix RLS policies for concept_files to ensure proper access control
-- Only owners can see/modify their files, others can only see files from published concepts

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert concept files" ON concept_files;
DROP POLICY IF EXISTS "File creators can delete their files" ON concept_files;
DROP POLICY IF EXISTS "File creators can update their files" ON concept_files;
DROP POLICY IF EXISTS "Users can view concept files for published concepts" ON concept_files;

-- Create new policies with proper access control
CREATE POLICY "Owners can insert their concept files"
ON concept_files FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Owners can update their concept files"
ON concept_files FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Owners can delete their concept files"
ON concept_files FOR DELETE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view concept files from published concepts"
ON concept_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM concepts 
    WHERE concepts.id = concept_files.concept_id 
    AND concepts.is_published = true
  ) 
  OR auth.uid() = creator_id
);

-- Fix profile_portfolio policies
DROP POLICY IF EXISTS "Users can view public portfolio files" ON profile_portfolio;
DROP POLICY IF EXISTS "Makers can view their own portfolio files" ON profile_portfolio;

-- Only allow viewing public portfolio files when portfolio visibility is enabled
CREATE POLICY "Users can view public portfolio files with correct settings"
ON profile_portfolio FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (is_public = true AND EXISTS (
    SELECT 1 FROM profile_settings ps 
    WHERE ps.maker_id = profile_portfolio.user_id 
    AND ps.show_portfolio = true
  ))
);

-- Ensure only owners can modify their portfolio
CREATE POLICY "Only owners can manage portfolio files"
ON profile_portfolio FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only owners can update portfolio files"
ON profile_portfolio FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Only owners can delete portfolio files"
ON profile_portfolio FOR DELETE
USING (auth.uid() = user_id);

-- Fix profile_tech_specs policies to ensure only owner can see tech specs
DROP POLICY IF EXISTS "Users can view their own tech specs" ON profile_tech_specs;

CREATE POLICY "Only owners can view their tech specs"
ON profile_tech_specs FOR SELECT
USING (auth.uid() = profile_id);

-- Tech specs should never be visible to others, only to the owner