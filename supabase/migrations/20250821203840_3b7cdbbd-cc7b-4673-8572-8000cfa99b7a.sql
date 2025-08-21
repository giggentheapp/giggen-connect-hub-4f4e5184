-- Update the profile_settings trigger function to use user_id instead of profile.id
DROP TRIGGER IF EXISTS trigger_create_profile_settings ON profiles;

CREATE OR REPLACE FUNCTION create_profile_settings_for_maker()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create settings if this is a maker and settings don't exist yet
  IF NEW.role = 'maker' AND NOT EXISTS (SELECT 1 FROM profile_settings WHERE maker_id = NEW.user_id) THEN
    INSERT INTO profile_settings (
      maker_id, 
      show_on_map, 
      show_about, 
      show_contact, 
      show_events, 
      show_portfolio, 
      show_techspec
    ) VALUES (
      NEW.user_id, 
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

-- Re-create the trigger
CREATE TRIGGER trigger_create_profile_settings
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_settings_for_maker();