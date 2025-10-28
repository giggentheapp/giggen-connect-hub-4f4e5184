-- Remove duplicate concept_files, keeping only the most recent one for each concept_id + file_path combination
DELETE FROM concept_files
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY concept_id, file_path 
        ORDER BY created_at DESC
      ) as rn
    FROM concept_files
  ) t
  WHERE rn > 1
);