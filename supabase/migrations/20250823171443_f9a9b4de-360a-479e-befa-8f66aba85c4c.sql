-- Fix RLS policies that failed in previous migration

-- Drop existing policies that conflict
DROP POLICY IF EXISTS "Makers can insert concept files" ON public.concept_files;
DROP POLICY IF EXISTS "Makers can update concept files" ON public.concept_files;  
DROP POLICY IF EXISTS "Makers can delete concept files" ON public.concept_files;
DROP POLICY IF EXISTS "Everyone can view concept files" ON public.concept_files;

-- Create proper concept_files policies
CREATE POLICY "Concept owners can insert files" ON public.concept_files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Concept owners can update files" ON public.concept_files
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Concept owners can delete files" ON public.concept_files
  FOR DELETE USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND maker_id = auth.uid())
  );

CREATE POLICY "Users can view concept files" ON public.concept_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM concepts WHERE id = concept_id AND is_published = true)
    OR (auth.uid() = user_id)
  );