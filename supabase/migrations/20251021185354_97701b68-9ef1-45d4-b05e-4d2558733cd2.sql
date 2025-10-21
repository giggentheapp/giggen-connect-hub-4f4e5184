-- Add username column to profiles table
ALTER TABLE profiles 
ADD COLUMN username VARCHAR(50) UNIQUE,
ADD COLUMN username_changed BOOLEAN DEFAULT FALSE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Add constraint for username format (alphanumeric, underscore, dash, 3-50 chars)
ALTER TABLE profiles 
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR username ~ '^[a-zA-Z0-9_-]{3,50}$'
);

-- Generate usernames for existing users without one
WITH numbered_users AS (
  SELECT 
    id,
    user_id,
    display_name,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM profiles
  WHERE username IS NULL OR username = ''
)
UPDATE profiles
SET username = LOWER(
  REGEXP_REPLACE(COALESCE(numbered_users.display_name, 'user'), '[^a-zA-Z0-9]', '', 'g') || '_' || numbered_users.row_num
),
username_changed = FALSE
FROM numbered_users
WHERE profiles.id = numbered_users.id;

-- Handle any potential duplicates by adding random suffix
UPDATE profiles
SET username = username || '_' || SUBSTR(MD5(RANDOM()::text), 1, 4)
WHERE id IN (
  SELECT id FROM (
    SELECT id, username, COUNT(*) OVER (PARTITION BY username) as cnt
    FROM profiles
  ) subq
  WHERE cnt > 1
);

-- Now make username NOT NULL after all existing users have usernames
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;