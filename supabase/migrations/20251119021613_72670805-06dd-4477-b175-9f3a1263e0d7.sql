-- Add 'completed' as a valid status for events_market table
ALTER TABLE events_market DROP CONSTRAINT IF EXISTS events_market_status_check;

-- Add new constraint that allows 'published' and 'completed' as valid statuses
ALTER TABLE events_market ADD CONSTRAINT events_market_status_check 
  CHECK (status IN ('published', 'completed'));