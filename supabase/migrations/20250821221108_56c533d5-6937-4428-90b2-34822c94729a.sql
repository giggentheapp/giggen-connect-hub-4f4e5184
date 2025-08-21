-- Add test makers for better map testing
-- First, let's update existing user with proper coordinates and avatar
UPDATE profiles 
SET 
  latitude = 59.9127300,
  longitude = 10.7460900,
  address = 'Stortingsgata 20, Oslo',
  avatar_url = 'https://i.pravatar.cc/150?img=1'
WHERE user_id = '28905882-8410-48bc-bf39-1bf5c2da0045';

-- Add a few test makers to see multiple markers with proper UUIDs
INSERT INTO profiles (id, user_id, display_name, role, bio, latitude, longitude, address, is_address_public, avatar_url) VALUES 
(gen_random_uuid(), gen_random_uuid(), 'Emma Nordahl', 'maker', 'UI/UX Designer og GIGGEN maker', 59.9166700, 10.7333300, 'Grünerløkka, Oslo', true, 'https://i.pravatar.cc/150?img=5'),
(gen_random_uuid(), gen_random_uuid(), 'Lars Hansen', 'maker', 'Fullstack Developer', 59.9075000, 10.7522200, 'Frogner, Oslo', true, 'https://i.pravatar.cc/150?img=7'),
(gen_random_uuid(), gen_random_uuid(), 'Maria Olsen', 'maker', 'Grafisk Designer', 59.9240000, 10.7315000, 'Majorstuen, Oslo', true, null),
(gen_random_uuid(), gen_random_uuid(), 'Thomas Berg', 'maker', 'Fotograf og Videograf', 59.9028000, 10.7194400, 'Sentrum, Oslo', true, 'https://i.pravatar.cc/150?img=12');