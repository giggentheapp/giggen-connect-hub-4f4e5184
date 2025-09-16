-- Fix the existing published booking to have correct status
UPDATE bookings 
SET status = 'upcoming'
WHERE id = 'f6197c25-9b9b-40cc-a38d-312712f4f324' 
AND published_by_sender = true 
AND published_by_receiver = true;