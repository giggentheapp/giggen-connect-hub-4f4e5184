
-- Delete the old duplicate file from user_files that is NOT connected to file_usage
DELETE FROM user_files
WHERE id = '54e0d863-4997-434d-98ac-4395d3accbe3'
  AND user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
  AND NOT EXISTS (
    SELECT 1 FROM file_usage WHERE file_id = '54e0d863-4997-434d-98ac-4395d3accbe3'
  );
