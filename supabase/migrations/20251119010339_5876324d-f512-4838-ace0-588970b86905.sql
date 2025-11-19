
-- Fix the file_usage reference_id to point to user_id instead of portfolio record id
UPDATE file_usage
SET reference_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
WHERE file_id = '7693d244-7dec-449a-9bb7-ee3f13af7a2e'
  AND usage_type = 'profile_portfolio';
