-- Add image columns to events_market for storing gallery images and profile images
ALTER TABLE events_market 
ADD COLUMN IF NOT EXISTS sender_profile_image TEXT,
ADD COLUMN IF NOT EXISTS receiver_profile_image TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery_videos JSONB DEFAULT '[]'::jsonb;

-- Add index for performance when querying events with images
CREATE INDEX IF NOT EXISTS idx_events_market_gallery ON events_market USING GIN (gallery_images);
CREATE INDEX IF NOT EXISTS idx_events_market_videos ON events_market USING GIN (gallery_videos);