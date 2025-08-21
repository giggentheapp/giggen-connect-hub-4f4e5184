-- Create profile_settings table for privacy controls
CREATE TABLE public.profile_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_id UUID NOT NULL UNIQUE,
  show_about BOOLEAN NOT NULL DEFAULT false,
  show_contact BOOLEAN NOT NULL DEFAULT false,
  show_portfolio BOOLEAN NOT NULL DEFAULT false,
  show_techspec BOOLEAN NOT NULL DEFAULT false,
  show_events BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_settings
CREATE POLICY "Makers can view their own settings" 
ON public.profile_settings 
FOR SELECT 
USING (auth.uid() = maker_id AND is_maker(auth.uid()));

CREATE POLICY "Makers can create their own settings" 
ON public.profile_settings 
FOR INSERT 
WITH CHECK (auth.uid() = maker_id AND is_maker(auth.uid()));

CREATE POLICY "Makers can update their own settings" 
ON public.profile_settings 
FOR UPDATE 
USING (auth.uid() = maker_id AND is_maker(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_profile_settings_updated_at
BEFORE UPDATE ON public.profile_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add avatar_url field to profiles table for profile pictures
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Update portfolio_files RLS policies to respect privacy settings
DROP POLICY IF EXISTS "Users can view public portfolio files" ON public.portfolio_files;

CREATE POLICY "Users can view public portfolio files" 
ON public.portfolio_files 
FOR SELECT 
USING (
  is_public = true AND 
  EXISTS (
    SELECT 1 FROM public.profile_settings ps 
    WHERE ps.maker_id = user_id AND ps.show_portfolio = true
  )
);

-- Update concept_files RLS policies to respect privacy settings  
DROP POLICY IF EXISTS "Users can view public concept files" ON public.concept_files;

CREATE POLICY "Users can view public concept files" 
ON public.concept_files 
FOR SELECT 
USING (
  is_public = true AND 
  EXISTS (
    SELECT 1 FROM public.profile_settings ps 
    WHERE ps.maker_id = user_id AND ps.show_techspec = true
  )
);

-- Function to get profile visibility settings
CREATE OR REPLACE FUNCTION public.get_profile_visibility(maker_uuid uuid)
RETURNS TABLE (
  show_about BOOLEAN,
  show_contact BOOLEAN,
  show_portfolio BOOLEAN,
  show_techspec BOOLEAN,
  show_events BOOLEAN
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ps.show_about, ps.show_contact, ps.show_portfolio, ps.show_techspec, ps.show_events
  FROM public.profile_settings ps
  WHERE ps.maker_id = maker_uuid;
END;
$function$;