-- Add visibility setting for band members in their profile
ALTER TABLE band_members 
ADD COLUMN show_in_profile boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN band_members.show_in_profile IS 'Controls whether the band is visible in the user''s profile section';