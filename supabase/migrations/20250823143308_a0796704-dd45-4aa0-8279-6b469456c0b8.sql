-- Create profile_tech_specs table for technical specification files
CREATE TABLE public.profile_tech_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'document',
  mime_type text,
  file_size integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_tech_specs ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_tech_specs
CREATE POLICY "Makers can view their own tech specs" 
ON public.profile_tech_specs 
FOR SELECT 
USING ((auth.uid() = creator_id) AND is_maker(auth.uid()));

CREATE POLICY "Makers can create their own tech specs" 
ON public.profile_tech_specs 
FOR INSERT 
WITH CHECK ((auth.uid() = creator_id) AND is_maker(auth.uid()));

CREATE POLICY "Makers can update their own tech specs" 
ON public.profile_tech_specs 
FOR UPDATE 
USING ((auth.uid() = creator_id) AND is_maker(auth.uid()));

CREATE POLICY "Makers can delete their own tech specs" 
ON public.profile_tech_specs 
FOR DELETE 
USING ((auth.uid() = creator_id) AND is_maker(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_profile_tech_specs_updated_at
BEFORE UPDATE ON public.profile_tech_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Rename portfolio_files to profile_portfolio for clarity
ALTER TABLE public.portfolio_files RENAME TO profile_portfolio;

-- Update concept_files table to ensure it has all needed fields
ALTER TABLE public.concept_files 
ADD COLUMN IF NOT EXISTS creator_id uuid;

-- Update concept_files to use creator_id if not already set
UPDATE public.concept_files 
SET creator_id = user_id 
WHERE creator_id IS NULL AND user_id IS NOT NULL;

-- Make creator_id not null
ALTER TABLE public.concept_files 
ALTER COLUMN creator_id SET NOT NULL;

-- Add tech_spec_reference field to concepts table for storing selected tech spec
ALTER TABLE public.concepts 
ADD COLUMN IF NOT EXISTS tech_spec_reference uuid REFERENCES public.profile_tech_specs(id);