-- Fix the sync function to handle type conversions properly
CREATE OR REPLACE FUNCTION public.sync_booking_to_events_market()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when booking becomes 'upcoming' (published)
  IF NEW.status = 'upcoming' AND (OLD.status IS NULL OR OLD.status != 'upcoming') THEN
    -- Insert into events_market (no ON CONFLICT since there's no unique constraint)
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
      CASE 
        WHEN NEW.time IS NOT NULL AND NEW.time != '' 
        THEN NEW.time::time
        ELSE NULL
      END,
      NEW.venue,
      NEW.ticket_price::numeric,
      NEW.audience_estimate,
      COALESCE(NEW.is_public_after_approval, true),
      NEW.sender_id, -- Creator of the booking
      NEW.selected_concept_id,
      NOW()
    );
    
    RAISE NOTICE 'Booking % synced to events_market', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;