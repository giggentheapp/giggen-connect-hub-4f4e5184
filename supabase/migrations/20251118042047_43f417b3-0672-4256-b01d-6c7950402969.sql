-- Add new fields to events_market table for arrangement creation feature

ALTER TABLE events_market 
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '{"musicians": [], "bands": [], "organizers": []}'::jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published'));

-- Add index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_events_market_status ON events_market(status);

-- Add index on created_by for better user query performance
CREATE INDEX IF NOT EXISTS idx_events_market_created_by ON events_market(created_by);

COMMENT ON COLUMN events_market.banner_url IS 'URL to banner image from filbank';
COMMENT ON COLUMN events_market.start_time IS 'Event start time';
COMMENT ON COLUMN events_market.end_time IS 'Event end time (optional)';
COMMENT ON COLUMN events_market.address IS 'Event address (optional)';
COMMENT ON COLUMN events_market.participants IS 'JSON structure: {musicians: [{user_id, display_name, username, avatar_url}], bands: [{band_id, name, image_url}], organizers: [{user_id, display_name, username, avatar_url}]}';
COMMENT ON COLUMN events_market.status IS 'Event status: draft or published';
