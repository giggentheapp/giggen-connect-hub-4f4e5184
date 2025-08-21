-- Create storage buckets for portfolio and concept files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('portfolio', 'portfolio', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('concepts', 'concepts', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);

-- Create portfolio_files table
CREATE TABLE public.portfolio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create concept_files table
CREATE TABLE public.concept_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.portfolio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio_files
CREATE POLICY "Users can view public portfolio files"
ON public.portfolio_files
FOR SELECT
USING (is_public = true);

CREATE POLICY "Makers can view their own portfolio files"
ON public.portfolio_files
FOR SELECT
USING (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only makers can create portfolio files"
ON public.portfolio_files
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only portfolio owners can update their files"
ON public.portfolio_files
FOR UPDATE
USING (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only portfolio owners can delete their files"
ON public.portfolio_files
FOR DELETE
USING (auth.uid() = user_id AND is_maker(auth.uid()));

-- RLS policies for concept_files
CREATE POLICY "Users can view public concept files"
ON public.concept_files
FOR SELECT
USING (is_public = true);

CREATE POLICY "Makers can view their own concept files"
ON public.concept_files
FOR SELECT
USING (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only makers can create concept files"
ON public.concept_files
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only concept owners can update their files"
ON public.concept_files
FOR UPDATE
USING (auth.uid() = user_id AND is_maker(auth.uid()));

CREATE POLICY "Only concept owners can delete their files"
ON public.concept_files
FOR DELETE
USING (auth.uid() = user_id AND is_maker(auth.uid()));

-- Storage policies for portfolio bucket
CREATE POLICY "Portfolio files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Users can upload to their own portfolio folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can update their own portfolio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'portfolio' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can delete their own portfolio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'portfolio' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

-- Storage policies for concepts bucket
CREATE POLICY "Concept files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'concepts');

CREATE POLICY "Users can upload to their own concept folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'concepts' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can update their own concept files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'concepts' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

CREATE POLICY "Users can delete their own concept files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'concepts' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  is_maker(auth.uid())
);

-- Add triggers for updated_at
CREATE TRIGGER update_portfolio_files_updated_at
BEFORE UPDATE ON public.portfolio_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_concept_files_updated_at
BEFORE UPDATE ON public.concept_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();