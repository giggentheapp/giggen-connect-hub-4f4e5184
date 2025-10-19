-- Add has_paid_tickets column to events_market
ALTER TABLE events_market ADD COLUMN IF NOT EXISTS has_paid_tickets BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN events_market.has_paid_tickets IS 'Indicates if paid tickets through Stripe are enabled for this event';
