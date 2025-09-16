-- Fix the sync function to better handle time conversion
CREATE OR REPLACE FUNCTION public.sync_booking_to_events_market()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when booking becomes 'upcoming' (published)
  IF NEW.status = 'upcoming' AND (OLD.status IS NULL OR OLD.status != 'upcoming') THEN
    -- Insert into events_market with proper type handling
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
      -- Only convert to time if it matches HH:MM pattern
      CASE 
        WHEN NEW.time ~ '^\d{2}:\d{2}(:\d{2})?$' 
        THEN NEW.time::time
        ELSE NULL
      END,
      NEW.venue,
      CASE WHEN NEW.ticket_price IS NOT NULL THEN NEW.ticket_price::numeric ELSE NULL END,
      NEW.audience_estimate,
      COALESCE(NEW.is_public_after_approval, true),
      NEW.sender_id,
      NEW.selected_concept_id,
      NOW()
    );
    
    RAISE NOTICE 'Booking % synced to events_market', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;