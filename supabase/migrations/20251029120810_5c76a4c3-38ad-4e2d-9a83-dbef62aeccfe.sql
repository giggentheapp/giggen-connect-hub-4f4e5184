
-- Oppdater eksisterende arrangement for brukere i whitelist
UPDATE events_market
SET has_paid_tickets = true
WHERE created_by IN (
  SELECT au.id 
  FROM auth.users au
  JOIN admin_whitelist aw ON aw.email = au.email
)
AND has_paid_tickets = false;
