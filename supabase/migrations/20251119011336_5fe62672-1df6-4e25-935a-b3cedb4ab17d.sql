
-- Clean up old entries from profile_portfolio that don't have corresponding files in user_files
-- Keep only entries that have valid file_usage links

-- First, delete old profile_portfolio entries that point to old buckets or don't have file_usage
DELETE FROM profile_portfolio
WHERE user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
  AND id NOT IN (
    SELECT DISTINCT pp.id
    FROM profile_portfolio pp
    INNER JOIN file_usage fu ON fu.reference_id = pp.user_id
    INNER JOIN user_files uf ON uf.id = fu.file_id
    WHERE pp.user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
      AND fu.usage_type = 'profile_portfolio'
      AND pp.filename = uf.filename
  );

-- Ensure the correct file is visible: the one in user_files that has file_usage
-- This file already exists with correct setup, just verifying
UPDATE profile_portfolio
SET is_public = true
WHERE user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
  AND filename = '1759673090613-IMG_9249.jpeg'
  AND file_path LIKE '%/image/%';
