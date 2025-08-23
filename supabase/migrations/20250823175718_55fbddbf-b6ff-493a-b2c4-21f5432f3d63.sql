-- Clean up and standardize the file tables structure

-- First, let's standardize profile_tech_specs table
ALTER TABLE public.profile_tech_specs 
DROP COLUMN IF EXISTS file_name CASCADE;

ALTER TABLE public.profile_tech_specs 
ADD COLUMN IF NOT EXISTS filename text NOT NULL DEFAULT '';

-- Ensure all tables have consistent column structure
-- profile_portfolio is already good

-- concept_files - remove redundant user_id since we have creator_id
ALTER TABLE public.concept_files 
DROP COLUMN IF EXISTS user_id CASCADE;

-- Update RLS policies to be consistent
DROP POLICY IF EXISTS "Makers can create their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Makers can delete their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Makers can update their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Makers can view their own tech specs" ON public.profile_tech_specs;

-- Create new RLS policies for profile_tech_specs
CREATE POLICY "Users can create their own tech specs" 
ON public.profile_tech_specs 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view their own tech specs" 
ON public.profile_tech_specs 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can update their own tech specs" 
ON public.profile_tech_specs 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own tech specs" 
ON public.profile_tech_specs 
FOR DELETE 
USING (auth.uid() = creator_id);