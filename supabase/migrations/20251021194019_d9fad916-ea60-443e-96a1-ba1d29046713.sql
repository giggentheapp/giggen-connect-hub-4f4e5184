-- Bands table
CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Band members junction table
CREATE TABLE band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'member', 'admin', 'founder'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(band_id, user_id)
);

-- Band invites
CREATE TABLE band_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(band_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bands
CREATE POLICY "Bands are viewable by everyone"
  ON bands FOR SELECT
  USING (true);

CREATE POLICY "Users can create bands"
  ON bands FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Band admins can update"
  ON bands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_members.band_id = bands.id 
      AND band_members.user_id = auth.uid() 
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can delete"
  ON bands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_members.band_id = bands.id 
      AND band_members.user_id = auth.uid() 
      AND band_members.role = 'founder'
    )
  );

-- RLS Policies for band_members
CREATE POLICY "Band members are viewable by everyone"
  ON band_members FOR SELECT
  USING (true);

CREATE POLICY "Band admins can manage members"
  ON band_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'founder')
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Band admins can update members"
  ON band_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Band admins can remove members"
  ON band_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM band_members bm
      WHERE bm.band_id = band_members.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('admin', 'founder')
    ) OR auth.uid() = user_id
  );

-- RLS Policies for band_invites
CREATE POLICY "Users can see their invites"
  ON band_invites FOR SELECT
  USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "Band admins can send invites"
  ON band_invites FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_members.band_id = band_invites.band_id 
      AND band_members.user_id = auth.uid() 
      AND band_members.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Users can update their invite status"
  ON band_invites FOR UPDATE
  USING (auth.uid() = invited_user_id);

CREATE POLICY "Band admins can delete invites"
  ON band_invites FOR DELETE
  USING (
    auth.uid() = invited_by OR
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_members.band_id = band_invites.band_id 
      AND band_members.user_id = auth.uid() 
      AND band_members.role IN ('admin', 'founder')
    )
  );

-- Indexes for performance
CREATE INDEX idx_band_members_user_id ON band_members(user_id);
CREATE INDEX idx_band_members_band_id ON band_members(band_id);
CREATE INDEX idx_band_invites_user_id ON band_invites(invited_user_id);
CREATE INDEX idx_bands_created_by ON bands(created_by);

-- Function to auto-add creator as founder when band is created
CREATE OR REPLACE FUNCTION add_band_founder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO band_members (band_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'founder');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add founder when band is created
CREATE TRIGGER on_band_created
  AFTER INSERT ON bands
  FOR EACH ROW
  EXECUTE FUNCTION add_band_founder();

-- Function to handle invite acceptance
CREATE OR REPLACE FUNCTION accept_band_invite(invite_id UUID)
RETURNS void AS $$
DECLARE
  invite_record RECORD;
BEGIN
  SELECT * INTO invite_record FROM band_invites WHERE id = invite_id AND invited_user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or access denied';
  END IF;
  
  IF invite_record.status != 'pending' THEN
    RAISE EXCEPTION 'Invite already responded to';
  END IF;
  
  -- Add user to band
  INSERT INTO band_members (band_id, user_id, role)
  VALUES (invite_record.band_id, invite_record.invited_user_id, 'member');
  
  -- Update invite status
  UPDATE band_invites
  SET status = 'accepted', responded_at = NOW()
  WHERE id = invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;