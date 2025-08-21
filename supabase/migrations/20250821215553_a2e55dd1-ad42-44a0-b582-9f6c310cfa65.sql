-- Clean up test profiles and related data
-- Delete test profiles (profiles with "test" in display_name or bio, or obvious test patterns)
DELETE FROM profile_settings WHERE maker_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

DELETE FROM portfolio_files WHERE user_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

DELETE FROM portfolio_items WHERE maker_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

DELETE FROM concept_files WHERE user_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

DELETE FROM concepts WHERE maker_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

DELETE FROM events WHERE maker_id IN (
    SELECT user_id FROM profiles 
    WHERE LOWER(display_name) LIKE '%test%' 
    OR LOWER(bio) LIKE '%test%'
    OR LOWER(display_name) LIKE '%dummy%'
    OR LOWER(display_name) LIKE '%sample%'
    OR display_name = 'Test Maker'
);

-- Finally delete the test profiles themselves
DELETE FROM profiles 
WHERE LOWER(display_name) LIKE '%test%' 
OR LOWER(bio) LIKE '%test%'
OR LOWER(display_name) LIKE '%dummy%'
OR LOWER(display_name) LIKE '%sample%'
OR display_name = 'Test Maker';