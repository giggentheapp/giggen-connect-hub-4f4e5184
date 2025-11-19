
-- Remove the profile_portfolio entry since we're using file_usage system now
-- Keep profile_portfolio table for backwards compatibility but clear Mathias's entries
DELETE FROM profile_portfolio
WHERE user_id = 'b2736eba-383c-4a12-9d77-ae3df154f4bf';
