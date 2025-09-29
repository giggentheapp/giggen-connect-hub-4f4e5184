-- First, let's see all problematic files
SELECT id, filename, file_path, user_id, created_at, file_type 
FROM profile_portfolio 
WHERE file_path NOT LIKE '%/%' 
   OR LENGTH(file_path) < 20  -- Hash IDs are typically shorter than proper paths
ORDER BY created_at DESC;

-- For now, let's update files that have hash-like file_paths (no slash and short length)
-- We'll reconstruct the proper path using timestamp from created_at and filename
UPDATE profile_portfolio 
SET file_path = user_id || '/' || EXTRACT(EPOCH FROM created_at)::bigint::text || '-' || filename
WHERE file_path NOT LIKE '%/%' 
   AND LENGTH(file_path) < 20
   AND filename IS NOT NULL 
   AND user_id IS NOT NULL;