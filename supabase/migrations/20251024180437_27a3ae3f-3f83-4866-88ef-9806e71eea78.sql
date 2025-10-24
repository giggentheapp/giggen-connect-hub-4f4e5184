-- Add category field to user_files table
ALTER TABLE public.user_files 
ADD COLUMN category text NOT NULL DEFAULT 'document';

-- Add check constraint for valid categories
ALTER TABLE public.user_files
ADD CONSTRAINT user_files_category_check 
CHECK (category IN ('image', 'video', 'audio', 'tech_spec', 'hospitality_rider', 'document'));

-- Add index for category filtering
CREATE INDEX idx_user_files_category ON public.user_files(category);

-- Update existing files based on mime_type
UPDATE public.user_files
SET category = CASE
  WHEN mime_type LIKE 'image/%' THEN 'image'
  WHEN mime_type LIKE 'video/%' THEN 'video'
  WHEN mime_type LIKE 'audio/%' THEN 'audio'
  WHEN file_type = 'document' AND (mime_type LIKE '%pdf%' OR filename LIKE '%.pdf') THEN 'document'
  ELSE 'document'
END;