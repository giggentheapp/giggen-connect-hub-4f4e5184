-- Remove the temporary testing policy
DROP POLICY IF EXISTS "Temporary: Allow all authenticated users to insert files" ON public.user_files;