
-- Update user_files to point to the actual file that exists in storage
UPDATE user_files
SET 
  file_path = 'b2736eba-383c-4a12-9d77-ae3df154f4bf/image/1763513330221_1759673090613-IMG_9249.jpeg',
  file_url = 'https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/b2736eba-383c-4a12-9d77-ae3df154f4bf/image/1763513330221_1759673090613-IMG_9249.jpeg'
WHERE id = '7693d244-7dec-449a-9bb7-ee3f13af7a2e'
  AND user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf';
