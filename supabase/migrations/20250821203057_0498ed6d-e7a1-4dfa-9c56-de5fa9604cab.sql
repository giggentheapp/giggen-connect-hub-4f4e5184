-- Create profile_settings for existing makers who don't have them
INSERT INTO profile_settings (maker_id, show_on_map, show_about, show_contact, show_events, show_portfolio, show_techspec)
SELECT 
  id as maker_id,
  false as show_on_map,
  false as show_about,
  false as show_contact,
  false as show_events,
  false as show_portfolio,
  false as show_techspec
FROM profiles 
WHERE role = 'maker' 
  AND id NOT IN (SELECT maker_id FROM profile_settings);

-- Create function to automatically create profile_settings for new makers
CREATE OR REPLACE FUNCTION create_profile_settings_for_maker()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create settings if this is a maker and settings don't exist yet
  IF NEW.role = 'maker' AND NOT EXISTS (SELECT 1 FROM profile_settings WHERE maker_id = NEW.id) THEN
    INSERT INTO profile_settings (
      maker_id, 
      show_on_map, 
      show_about, 
      show_contact, 
      show_events, 
      show_portfolio, 
      show_techspec
    ) VALUES (
      NEW.id, 
      false, 
      false, 
      false, 
      false, 
      false, 
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile_settings for new makers
CREATE OR REPLACE TRIGGER trigger_create_profile_settings
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_settings_for_maker();