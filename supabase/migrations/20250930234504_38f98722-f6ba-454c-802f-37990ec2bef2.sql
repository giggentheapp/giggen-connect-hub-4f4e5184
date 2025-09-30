-- Ensure status column exists with correct values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'concepts' AND column_name = 'status'
  ) THEN
    ALTER TABLE concepts ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_concepts_status ON concepts(status);
CREATE INDEX IF NOT EXISTS idx_concepts_maker_status ON concepts(maker_id, status);

-- Create concept-drafts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('concept-drafts', 'concept-drafts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for concept-drafts bucket
CREATE POLICY "Users can upload their own draft files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'concept-drafts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own draft files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'concept-drafts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own draft files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'concept-drafts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own draft files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'concept-drafts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);