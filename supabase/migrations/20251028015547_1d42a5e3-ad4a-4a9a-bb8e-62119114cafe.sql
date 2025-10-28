-- Add is_public field to bands table
ALTER TABLE bands ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Update RLS policy to only show public bands in explore
DROP POLICY IF EXISTS "Bands are viewable by everyone" ON bands;

CREATE POLICY "Band members can view their bands"
ON bands FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM band_members
    WHERE band_members.band_id = bands.id
    AND band_members.user_id = auth.uid()
  )
);

CREATE POLICY "Public bands are viewable by everyone"
ON bands FOR SELECT
USING (is_public = true);