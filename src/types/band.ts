export interface Band {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  genre: string | null;
  bio: string | null;
  founded_year: number | null;
  is_public: boolean;
  music_links: {
    spotify?: string;
    youtube?: string;
    soundcloud?: string;
    appleMusic?: string;
    bandcamp?: string;
  } | null;
  social_media_links: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    website?: string;
  } | null;
  contact_info: {
    email?: string;
    phone?: string;
    booking_email?: string;
  } | null;
  discography: string[] | null;
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
