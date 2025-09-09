-- Create new enum type with the desired values
CREATE TYPE booking_status_new AS ENUM (
  'pending',              -- Forespørsel sendt, venter på svar
  'allowed',              -- Mottaker har tillatt forespørselen, kontaktinfo vises  
  'both_parties_approved',-- Begge parter har godkjent endelig avtale
  'upcoming',             -- Publisert arrangement, synlig offentlig
  'completed',            -- Gjennomført
  'cancelled'             -- Avlyst
);

-- Add a new column with the new enum type
ALTER TABLE bookings ADD COLUMN status_new booking_status_new DEFAULT 'pending';

-- Map existing values to new enum values
UPDATE bookings SET status_new = 'pending' WHERE status IN ('draft', 'pending');
UPDATE bookings SET status_new = 'allowed' WHERE status = 'allowed';
UPDATE bookings SET status_new = 'both_parties_approved' WHERE status IN ('approved', 'confirmed');
UPDATE bookings SET status_new = 'upcoming' WHERE status = 'published';
UPDATE bookings SET status_new = 'completed' WHERE status = 'deleted';
UPDATE bookings SET status_new = 'cancelled' WHERE status IN ('rejected', 'cancelled');

-- Drop the old status column
ALTER TABLE bookings DROP COLUMN status;

-- Rename the new column to the original name
ALTER TABLE bookings RENAME COLUMN status_new TO status;

-- Drop the old enum type
DROP TYPE booking_status CASCADE;

-- Rename the new enum type
ALTER TYPE booking_status_new RENAME TO booking_status;

-- Set the default value
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending'::booking_status;

-- Drop existing RLS policies and recreate with new structure
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