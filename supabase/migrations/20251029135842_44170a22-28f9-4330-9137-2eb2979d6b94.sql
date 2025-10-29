-- Add concept_type column to concepts table
ALTER TABLE concepts 
ADD COLUMN concept_type TEXT NOT NULL DEFAULT 'session_musician';

-- Add comment explaining the types
COMMENT ON COLUMN concepts.concept_type IS 'Type of concept: session_musician or teaching';

-- Add teaching-specific fields to concepts table
ALTER TABLE concepts
ADD COLUMN teaching_data JSONB DEFAULT NULL;

COMMENT ON COLUMN concepts.teaching_data IS 'Structured data for teaching/course offers including selected sections and custom fields';