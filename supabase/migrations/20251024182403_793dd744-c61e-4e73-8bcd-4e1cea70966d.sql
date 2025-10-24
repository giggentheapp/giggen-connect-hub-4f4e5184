-- Add new fields to bands table for comprehensive band information
ALTER TABLE bands
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS music_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS discography TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for genre searches
CREATE INDEX IF NOT EXISTS idx_bands_genre ON bands(genre);

-- Add index for founded_year
CREATE INDEX IF NOT EXISTS idx_bands_founded_year ON bands(founded_year);

COMMENT ON COLUMN bands.genre IS 'Musical genre/style of the band';
COMMENT ON COLUMN bands.bio IS 'Detailed biography about the band';
COMMENT ON COLUMN bands.banner_url IS 'Banner/cover image URL for band profile';
COMMENT ON COLUMN bands.founded_year IS 'Year the band was founded';
COMMENT ON COLUMN bands.music_links IS 'JSON object with music platform links (spotify, youtube, etc)';
COMMENT ON COLUMN bands.social_media_links IS 'JSON object with social media links';
COMMENT ON COLUMN bands.contact_info IS 'JSON object with contact information for booking';
COMMENT ON COLUMN bands.discography IS 'Array of songs/albums released by the band';