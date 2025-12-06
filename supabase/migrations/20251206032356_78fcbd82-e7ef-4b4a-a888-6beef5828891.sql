-- Remove the foreign key constraints that require files to be in specific tables
-- Files are stored in user_files (filbank) with category='tech_spec' or 'hospitality_rider'

ALTER TABLE concepts 
DROP CONSTRAINT IF EXISTS concepts_tech_spec_reference_fkey;

-- Note: hospitality_rider_reference doesn't have a FK constraint based on schema
-- but let's make sure it's also flexible

COMMENT ON COLUMN concepts.tech_spec_reference IS 'UUID reference to a file (can be user_files, profile_tech_specs, or null)';
COMMENT ON COLUMN concepts.hospitality_rider_reference IS 'UUID reference to a file (can be user_files, hospitality_riders, or null)';