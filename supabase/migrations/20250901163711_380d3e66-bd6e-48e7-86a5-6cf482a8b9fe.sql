-- Create concepts_history table for rejected concepts
CREATE TABLE public.concepts_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_concept_id UUID NOT NULL,
  maker_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'rejected',
  price NUMERIC,
  expected_audience INTEGER,
  tech_spec TEXT,
  available_dates JSONB,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rejected_by UUID NOT NULL,
  rejection_reason TEXT,
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_data JSONB -- Store the full original concept data
);

-- Enable Row Level Security
ALTER TABLE public.concepts_history ENABLE ROW LEVEL SECURITY;

-- Create policies for concepts_history
CREATE POLICY "Users can view their own concept history"
  ON public.concepts_history
  FOR SELECT
  USING (auth.uid() = maker_id OR auth.uid() = rejected_by);

CREATE POLICY "Users can create concept history entries"
  ON public.concepts_history
  FOR INSERT
  WITH CHECK (auth.uid() = rejected_by);

-- Add index for better performance
CREATE INDEX idx_concepts_history_maker_id ON public.concepts_history(maker_id);
CREATE INDEX idx_concepts_history_rejected_by ON public.concepts_history(rejected_by);