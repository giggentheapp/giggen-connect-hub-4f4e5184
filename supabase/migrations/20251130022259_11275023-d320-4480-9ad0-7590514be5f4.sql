-- Add program_type column to concepts table for organizer offers
ALTER TABLE concepts 
ADD COLUMN IF NOT EXISTS program_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN concepts.program_type IS 'Type of program for organizer offers: quiz, standup, jam, visekveld, lokale_helter, open_mic, annet';