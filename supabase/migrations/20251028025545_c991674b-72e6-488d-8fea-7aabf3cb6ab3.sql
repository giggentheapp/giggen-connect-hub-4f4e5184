-- Create security definer function to check if file is in portfolio (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_file_in_portfolio(file_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM file_usage
    WHERE file_id = file_uuid
    AND usage_type = 'profile_portfolio'
  )
$$;

-- Update RLS policy on user_files to use the security definer function
DROP POLICY IF EXISTS "Users can view their own files or public files" ON user_files;

CREATE POLICY "Users can view their own files or public files"
ON user_files
FOR SELECT
USING (
  -- Users can see their own files
  auth.uid() = user_id
  OR
  -- Users can see public files
  (is_public = true AND auth.uid() IS NOT NULL)
  OR
  -- Users can see files that are in profile portfolios (using security definer function)
  (auth.uid() IS NOT NULL AND public.is_file_in_portfolio(id))
);