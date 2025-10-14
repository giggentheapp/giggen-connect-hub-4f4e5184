-- Migrering 2: Oppdater eksisterende data til nye rolleverdier
-- 'artist' (musikkprodusenter) blir 'musician'
-- 'audience' (de som arrangerer) blir 'organizer'
UPDATE profiles 
SET role = 'musician'::user_role
WHERE role = 'artist'::user_role;

UPDATE profiles 
SET role = 'organizer'::user_role
WHERE role = 'audience'::user_role;

-- Oppdater default-verdi til musician
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'musician'::user_role;

-- Verifiser resultatet
DO $$
DECLARE
  musician_count INTEGER;
  organizer_count INTEGER;
  old_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO musician_count FROM profiles WHERE role = 'musician'::user_role;
  SELECT COUNT(*) INTO organizer_count FROM profiles WHERE role = 'organizer'::user_role;
  SELECT COUNT(*) INTO old_count FROM profiles WHERE role IN ('artist'::user_role, 'audience'::user_role);
  
  RAISE NOTICE 'Rolleoppdatering fullført: musician=%, organizer=%, gamle verdier=%', musician_count, organizer_count, old_count;
  
  IF old_count > 0 THEN
    RAISE WARNING 'Det finnes fortsatt % profiler med gamle rolleverdier!', old_count;
  END IF;
END $$;