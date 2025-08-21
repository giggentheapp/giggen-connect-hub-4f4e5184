-- Enable map visibility for the Test Maker so we can test the map functionality
INSERT INTO profile_settings (maker_id, show_on_map, show_about, show_contact, show_events, show_portfolio, show_techspec)
VALUES ('d92c46be-6054-4683-9ff1-e5fb07c2f24b', true, true, true, true, true, true)
ON CONFLICT (maker_id) 
DO UPDATE SET 
  show_on_map = true,
  updated_at = now();