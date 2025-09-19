-- Fix the sync trigger to handle portfolio_id correctly
-- The issue is that selected_concept_id references concepts table, not profile_portfolio

CREATE OR REPLACE FUNCTION public.sync_booking_to_events_market()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Only sync when booking becomes 'upcoming' (published) AND has event_date set
  IF NEW.status = 'upcoming' AND (OLD.status IS NULL OR OLD.status != 'upcoming') AND NEW.event_date IS NOT NULL THEN
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
      -- Set portfolio_id to NULL for now since selected_concept_id doesn't map to profile_portfolio
      -- This can be enhanced later to find the correct portfolio file if needed
      NULL,
      NOW()
    );
    
    RAISE NOTICE 'Booking % synced to events_market', NEW.id;
  ELSIF NEW.status = 'upcoming' AND NEW.event_date IS NULL THEN
    RAISE NOTICE 'Booking % not synced - missing event_date', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;