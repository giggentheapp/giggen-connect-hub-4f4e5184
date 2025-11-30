-- Add booking_id to events_market to link events to bookings
ALTER TABLE events_market 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

-- Add event_id to bookings to link bookings to events
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events_market(id) ON DELETE SET NULL;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_market_booking_id ON events_market(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);

-- Add comments
COMMENT ON COLUMN events_market.booking_id IS 'Referanse til booking-avtalen dette arrangementet er basert på';
COMMENT ON COLUMN bookings.event_id IS 'Referanse til arrangementet som er opprettet fra denne booking-avtalen';