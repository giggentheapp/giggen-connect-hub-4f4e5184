-- Update existing user with complete profile data for testing
UPDATE profiles 
SET 
  latitude = 59.9127300,
  longitude = 10.7460900,
  address = 'Stortingsgata 20, Oslo',
  avatar_url = 'https://i.pravatar.cc/150?img=1'
WHERE user_id = '28905882-8410-48bc-bf39-1bf5c2da0045';