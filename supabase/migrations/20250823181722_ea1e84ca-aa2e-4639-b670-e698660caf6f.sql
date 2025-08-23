-- Fix concept_files.creator_id to be NOT NULL and add proper foreign key
ALTER TABLE public.concept_files 
ALTER COLUMN creator_id SET NOT NULL;

-- Add foreign key reference to profiles table
ALTER TABLE public.concept_files 
ADD CONSTRAINT fk_concept_files_creator_id 
FOREIGN KEY (creator_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;