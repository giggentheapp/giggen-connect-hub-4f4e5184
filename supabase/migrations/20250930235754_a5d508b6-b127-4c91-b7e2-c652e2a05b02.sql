-- Add SELECT policy for concept_files so people can view portfolio files
-- Allow viewing concept files for published concepts
CREATE POLICY "Anyone can view files from published concepts"
ON concept_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM concepts
    WHERE concepts.id = concept_files.concept_id
    AND concepts.is_published = true
  )
);

-- Allow owners to view their own concept files (even unpublished)
CREATE POLICY "Owners can view their own concept files"
ON concept_files
FOR SELECT
USING (auth.uid() = creator_id);