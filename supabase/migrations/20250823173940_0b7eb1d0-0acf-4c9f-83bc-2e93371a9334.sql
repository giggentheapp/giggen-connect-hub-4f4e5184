-- Add creator_id column to concept_files table
ALTER TABLE public.concept_files 
ADD COLUMN creator_id uuid REFERENCES public.profiles(id);

-- Set creator_id to user_id for existing records (migration safety)
UPDATE public.concept_files 
SET creator_id = user_id 
WHERE creator_id IS NULL;

-- Make creator_id NOT NULL after setting values
ALTER TABLE public.concept_files 
ALTER COLUMN creator_id SET NOT NULL;

-- Create trigger function to automatically set creator_id on insert
CREATE OR REPLACE FUNCTION public.set_creator_id_on_concept_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Set creator_id to the authenticated user's ID
  NEW.creator_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on insert
CREATE TRIGGER set_creator_id_trigger
  BEFORE INSERT ON public.concept_files
  FOR EACH ROW
  EXECUTE FUNCTION public.set_creator_id_on_concept_files();

-- Drop existing RLS policies for concept_files
DROP POLICY IF EXISTS "Concept owners can delete files" ON public.concept_files;
DROP POLICY IF EXISTS "Concept owners can insert files" ON public.concept_files;
DROP POLICY IF EXISTS "Concept owners can update files" ON public.concept_files;
DROP POLICY IF EXISTS "Users can view concept files" ON public.concept_files;

-- Create updated RLS policies using creator_id
CREATE POLICY "File creators can delete their files" 
ON public.concept_files 
FOR DELETE 
USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can insert concept files" 
ON public.concept_files 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "File creators can update their files" 
ON public.concept_files 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view concept files for published concepts" 
ON public.concept_files 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.concepts 
    WHERE concepts.id = concept_files.concept_id 
    AND concepts.is_published = true
  ) 
  OR auth.uid() = creator_id
);