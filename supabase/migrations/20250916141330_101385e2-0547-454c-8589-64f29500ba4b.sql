-- Check the structure of events_market table to understand conflicts
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events_market' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints and indexes on events_market
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'events_market' 
AND tc.table_schema = 'public';