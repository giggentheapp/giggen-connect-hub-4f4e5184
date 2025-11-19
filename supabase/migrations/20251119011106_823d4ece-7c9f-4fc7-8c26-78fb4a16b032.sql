
-- Update the uploaded file to be public so it shows in portfolio
UPDATE user_files
SET is_public = true
WHERE id = '7693d244-7dec-449a-9bb7-ee3f13af7a2e'
  AND user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf';
