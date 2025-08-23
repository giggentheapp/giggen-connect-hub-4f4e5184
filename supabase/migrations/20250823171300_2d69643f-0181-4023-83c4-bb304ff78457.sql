-- Clean up database structure for proper portfolio separation

-- 1. Remove duplicate/conflicting portfolio tables that are causing issues
DROP TABLE IF EXISTS public.portfolio CASCADE;
DROP TABLE IF EXISTS public.profile_files CASCADE; 
DROP TABLE IF EXISTS public.profile_images CASCADE;
DROP TABLE IF EXISTS public.profile_picture CASCADE;
DROP TABLE IF EXISTS public.portfolio_items CASCADE;

-- 2. Ensure concept_files table has correct structure (no creator_id field)
-- Remove creator_id column if it exists in concept_files
ALTER TABLE public.concept_files DROP COLUMN IF EXISTS creator_id;

-- 3. Ensure clean separation - profile_portfolio for profile, concept_files for concepts
-- profile_portfolio should only be for user profiles
-- concept_files should only be for concept portfolios

-- 4. Add missing file_url column to profile_portfolio if it doesn't exist
ALTER TABLE public.profile_portfolio ADD COLUMN IF NOT EXISTS file_url text;

-- 5. Update profile_portfolio to have proper URL generation
UPDATE public.profile_portfolio 
SET file_url = CONCAT('https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/', file_path)
WHERE file_url IS NULL AND file_path IS NOT NULL;

-- 6. Ensure concept_files has proper structure and constraints
ALTER TABLE public.concept_files 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN concept_id SET NOT NULL,
  ALTER COLUMN filename SET NOT NULL,
  ALTER COLUMN file_path SET NOT NULL;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_concept_files_concept_id ON public.concept_files(concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_files_user_id ON public.concept_files(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_portfolio_user_id ON public.profile_portfolio(user_id);

-- 8. Update RLS policies to ensure proper access control
-- Concept files: only concept owners can manage
DROP POLICY IF EXISTS "Users can insert own concept_files" ON public.concept_files;
DROP POLICY IF EXISTS "Users can update own concept_files" ON public.concept_files;
DROP POLICY IF EXISTS "Users can delete own concept_files" ON public.concept_files;
DROP POLICY IF EXISTS "Users can view own concept_files" ON public.concept_files;

-- Recreate concept_files policies with proper logic
CREATE POLICY "Makers can insert concept files" ON public.concept_files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Makers can update concept files" ON public.concept_files
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Makers can delete concept files" ON public.concept_files
  FOR DELETE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Everyone can view concept files" ON public.concept_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND is_published = true)
    OR (auth.uid() = user_id)
  );