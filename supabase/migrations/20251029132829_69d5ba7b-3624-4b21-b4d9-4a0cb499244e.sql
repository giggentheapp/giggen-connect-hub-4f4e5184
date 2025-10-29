-- Legg til event_admin_id i bookings-tabellen
-- Dette er personen som skal ha kontroll over synlighet og andre admin-funksjoner
ALTER TABLE bookings 
ADD COLUMN event_admin_id uuid REFERENCES auth.users(id);

-- Legg til en kommentar for å forklare feltet
COMMENT ON COLUMN bookings.event_admin_id IS 'User ID of the party designated as event administrator. Only this user can control event visibility and admin settings.';

-- Oppdater eksisterende bookings til å sette sender som default admin
UPDATE bookings 
SET event_admin_id = sender_id 
WHERE event_admin_id IS NULL 
  AND status IN ('approved_by_both', 'upcoming', 'completed');