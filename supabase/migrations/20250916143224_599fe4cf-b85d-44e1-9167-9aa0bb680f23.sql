-- Set a proper event date for the published jazz booking that has null event_date
UPDATE bookings 
SET event_date = '2024-12-01 19:00:00+00'::timestamptz
WHERE id = 'f6197c25-9b9b-40cc-a38d-312712f4f324' 
AND event_date IS NULL 
AND status = 'upcoming';