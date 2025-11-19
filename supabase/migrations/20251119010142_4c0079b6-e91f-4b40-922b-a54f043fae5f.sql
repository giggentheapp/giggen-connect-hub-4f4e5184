-- Add the newly uploaded image to Mathias's portfolio
INSERT INTO profile_portfolio (
  user_id,
  filename,
  file_path,
  file_url,
  file_type,
  file_size,
  mime_type,
  is_public
) VALUES (
  'b2736eba-383c-4a12-9d77-ae3df154f4bf',
  '1759673090613-IMG_9249.jpeg',
  'b2736eba-383c-4a12-9d77-ae3df154f4bf/image/1763513740983_1759673090613-IMG_9249.jpeg',
  'https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/b2736eba-383c-4a12-9d77-ae3df154f4bf/image/1763513740983_1759673090613-IMG_9249.jpeg',
  'image',
  9104738,
  'image/jpeg',
  true
) ON CONFLICT DO NOTHING;

-- Track usage in file_usage table
INSERT INTO file_usage (
  file_id,
  usage_type,
  reference_id
)
SELECT 
  '7693d244-7dec-449a-9bb7-ee3f13af7a2e',
  'profile_portfolio',
  id
FROM profile_portfolio
WHERE user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf'
  AND filename = '1759673090613-IMG_9249.jpeg'
ON CONFLICT DO NOTHING;