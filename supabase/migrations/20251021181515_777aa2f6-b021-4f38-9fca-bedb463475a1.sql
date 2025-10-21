-- Delete all bookings with historical status (completed or cancelled)
DELETE FROM bookings WHERE status IN ('completed', 'cancelled');