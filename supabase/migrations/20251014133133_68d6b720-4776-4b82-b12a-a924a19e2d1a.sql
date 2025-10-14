-- Migrering 1: Legg til nye enum-verdier
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'musician';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer';