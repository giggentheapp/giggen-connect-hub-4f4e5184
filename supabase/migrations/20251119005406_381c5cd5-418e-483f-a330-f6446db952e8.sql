-- Temporarily allow all authenticated users to insert files for testing
CREATE POLICY "Temporary: Allow all authenticated users to insert files"
ON public.user_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Add a comment to remember this is temporary
COMMENT ON POLICY "Temporary: Allow all authenticated users to insert files" ON public.user_files 
IS 'TEMPORARY POLICY FOR TESTING - REMOVE AFTER DEBUGGING';