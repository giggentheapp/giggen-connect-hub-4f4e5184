-- Function to sync published bookings to events_market
CREATE OR REPLACE FUNCTION sync_booking_to_events_market()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when booking becomes 'upcoming' (published)
  IF NEW.status = 'upcoming' AND OLD.status != 'upcoming' THEN
    -- Insert or update in events_market
    INSERT INTO events_market (
      title,
      description,
      date,
      time,
      venue,
      ticket_price,
      expected_audience,
      is_public,
      created_by,
      portfolio_id,
      created_at
    ) VALUES (
      NEW.title,
      NEW.description,
      NEW.event_date::date,
      NEW.time,
      NEW.venue,
      NEW.ticket_price::numeric,
      NEW.audience_estimate,
      NEW.is_public_after_approval,
      NEW.sender_id, -- Creator of the booking
      NEW.selected_concept_id,
      NOW()
    )
    ON CONFLICT (title, venue, date, created_by) 
    DO UPDATE SET
      description = EXCLUDED.description,
      time = EXCLUDED.time,
      ticket_price = EXCLUDED.ticket_price,
      expected_audience = EXCLUDED.expected_audience,
      is_public = EXCLUDED.is_public,
      portfolio_id = EXCLUDED.portfolio_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS sync_published_bookings_trigger ON bookings;
CREATE TRIGGER sync_published_bookings_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_events_market();