export interface Band {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BandMember {
  id: string;
  band_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'founder';
  joined_at: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    role: string;
  };
}

export interface BandInvite {
  id: string;
  band_id: string;
  invited_by: string;
  invited_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  band?: Band;
  inviter?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface BandWithMembers extends Band {
  members?: BandMember[];
  member_count?: number;
}
