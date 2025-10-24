-- Create central file bank table
CREATE TABLE IF NOT EXISTS public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create file usage tracking table
CREATE TABLE IF NOT EXISTS public.file_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('profile_portfolio', 'tech_spec', 'hospitality_rider', 'band_portfolio', 'band_tech_spec', 'band_hospitality')),
  reference_id UUID, -- band_id if usage is for band
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_files
CREATE POLICY "Users can view their own files"
  ON public.user_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.user_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON public.user_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.user_files FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for file_usage
CREATE POLICY "Users can view their file usage"
  ON public.file_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_files
      WHERE user_files.id = file_usage.file_id
      AND user_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert file usage"
  ON public.file_usage FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_files
      WHERE user_files.id = file_usage.file_id
      AND user_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete file usage"
  ON public.file_usage FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_files
      WHERE user_files.id = file_usage.file_id
      AND user_files.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX idx_user_files_file_type ON public.user_files(file_type);
CREATE INDEX idx_file_usage_file_id ON public.file_usage(file_id);
CREATE INDEX idx_file_usage_type ON public.file_usage(usage_type);

-- Function to get file usage summary
CREATE OR REPLACE FUNCTION public.get_file_usage_summary(p_file_id UUID)
RETURNS TABLE(usage_type TEXT, reference_id UUID, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fu.usage_type,
    fu.reference_id,
    COUNT(*)::BIGINT as count
  FROM public.file_usage fu
  WHERE fu.file_id = p_file_id
  GROUP BY fu.usage_type, fu.reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;