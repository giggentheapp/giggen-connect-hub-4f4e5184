-- Update existing files without file_url to generate their URLs
UPDATE user_files
SET file_url = 'https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/' || file_path
WHERE file_url IS NULL
AND bucket_name = 'filbank';