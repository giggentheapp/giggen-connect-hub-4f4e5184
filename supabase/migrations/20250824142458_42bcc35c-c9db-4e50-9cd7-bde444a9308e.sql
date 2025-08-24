-- Step 1: Add profile_id column with foreign key reference to profiles
ALTER TABLE public.profile_tech_specs 
ADD COLUMN profile_id uuid REFERENCES public.profiles(user_id);

-- Step 2: Copy data from creator_id to profile_id
UPDATE public.profile_tech_specs 
SET profile_id = creator_id;

-- Step 3: Make profile_id NOT NULL
ALTER TABLE public.profile_tech_specs 
ALTER COLUMN profile_id SET NOT NULL;

-- Step 4: Drop the old creator_id column
ALTER TABLE public.profile_tech_specs 
DROP COLUMN creator_id;

-- Step 5: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can create their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Users can delete their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Users can update their own tech specs" ON public.profile_tech_specs;
DROP POLICY IF EXISTS "Users can view their own tech specs" ON public.profile_tech_specs;

-- Step 6: Create new RLS policies using profile_id
CREATE POLICY "Users can create their own tech specs" 
ON public.profile_tech_specs 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own tech specs" 
ON public.profile_tech_specs 
FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Users can update their own tech specs" 
ON public.profile_tech_specs 
FOR UPDATE 
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own tech specs" 
ON public.profile_tech_specs 
FOR DELETE 
USING (auth.uid() = profile_id);

-- Step 7: Create trigger to auto-set profile_id on insert
CREATE OR REPLACE FUNCTION public.set_profile_id_on_tech_specs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_profile_id_tech_specs
  BEFORE INSERT ON public.profile_tech_specs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_id_on_tech_specs();