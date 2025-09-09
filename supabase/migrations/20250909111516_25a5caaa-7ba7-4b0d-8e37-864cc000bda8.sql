-- First, update existing bookings to map to new status values
UPDATE bookings SET status = 'pending' WHERE status IN ('draft');
UPDATE bookings SET status = 'both_parties_approved' WHERE status IN ('approved', 'confirmed');
UPDATE bookings SET status = 'upcoming' WHERE status IN ('published');
UPDATE bookings SET status = 'completed' WHERE status IN ('deleted'); -- Map deleted to completed for now
UPDATE bookings SET status = 'cancelled' WHERE status IN ('rejected');

-- Create new enum type with updated values
CREATE TYPE booking_status_new AS ENUM (
  'pending',              -- Forespørsel sendt, venter på svar
  'allowed',              -- Mottaker har tillatt forespørselen, kontaktinfo vises  
  'both_parties_approved',-- Begge parter har godkjent endelig avtale
  'upcoming',             -- Publisert arrangement, synlig offentlig
  'completed',            -- Gjennomført
  'cancelled'             -- Avlyst
);

-- Update the column to use the new enum type
ALTER TABLE bookings 
  ALTER COLUMN status TYPE booking_status_new 
  USING status::text::booking_status_new;

-- Drop the old enum and rename the new one
DROP TYPE booking_status CASCADE;
ALTER TYPE booking_status_new RENAME TO booking_status;

-- Update default value
ALTER TABLE bookings 
  ALTER COLUMN status SET DEFAULT 'pending'::booking_status;

-- Drop existing policies to recreate them with the new structure
DROP POLICY IF EXISTS "Booking parties can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Booking parties can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Only booking parties can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Only makers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view published booking info" ON bookings;

-- Create new RLS policies with proper status validation
CREATE POLICY "update_booking_status"
ON bookings
FOR UPDATE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
)
WITH CHECK (
  (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
  status IN ('pending', 'allowed', 'both_parties_approved', 'upcoming', 'completed', 'cancelled')
);

-- Policy: Only the parties can read booking details
CREATE POLICY "read_booking_details"
ON bookings
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy: Only makers can create bookings
CREATE POLICY "create_booking_request"
ON bookings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = sender_id AND 
  is_maker(auth.uid()) AND
  status = 'pending'
);

-- Policy: Only the parties can delete bookings
CREATE POLICY "delete_booking"
ON bookings
FOR DELETE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy: Public can view upcoming bookings (published events)
CREATE POLICY "public_view_upcoming_bookings"
ON bookings
FOR SELECT
USING (
  status = 'upcoming' AND 
  is_public_after_approval = true AND
  auth.uid() IS NOT NULL AND
  auth.uid() != sender_id AND 
  auth.uid() != receiver_id
);