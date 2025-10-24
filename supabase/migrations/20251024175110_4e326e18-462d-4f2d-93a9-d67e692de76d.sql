-- Create band_portfolio table
CREATE TABLE IF NOT EXISTS public.band_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create band_tech_specs table
CREATE TABLE IF NOT EXISTS public.band_tech_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create band_hospitality table
CREATE TABLE IF NOT EXISTS public.band_hospitality (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.band_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_tech_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_hospitality ENABLE ROW LEVEL SECURITY;

-- RLS policies for band_portfolio
CREATE POLICY "Band members can view band portfolio"
  ON public.band_portfolio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_portfolio.band_id
      AND band_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Band admins can insert portfolio"
  ON public.band_portfolio FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_portfolio.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can update portfolio"
  ON public.band_portfolio FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_portfolio.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can delete portfolio"
  ON public.band_portfolio FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_portfolio.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

-- RLS policies for band_tech_specs
CREATE POLICY "Band members can view tech specs"
  ON public.band_tech_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_tech_specs.band_id
      AND band_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Band admins can manage tech specs"
  ON public.band_tech_specs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_tech_specs.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

-- RLS policies for band_hospitality
CREATE POLICY "Band members can view hospitality"
  ON public.band_hospitality FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_hospitality.band_id
      AND band_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Band admins can manage hospitality"
  ON public.band_hospitality FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_members.band_id = band_hospitality.band_id
      AND band_members.user_id = auth.uid()
      AND band_members.role IN ('admin', 'founder')
    )
  );

-- Create indexes
CREATE INDEX idx_band_portfolio_band_id ON public.band_portfolio(band_id);
CREATE INDEX idx_band_tech_specs_band_id ON public.band_tech_specs(band_id);
CREATE INDEX idx_band_hospitality_band_id ON public.band_hospitality(band_id);