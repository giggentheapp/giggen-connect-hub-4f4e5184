/**
 * Authentication-related TypeScript interfaces and types
 */

import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

export type UserRole = 'musiker' | 'arrangør';

/**
 * Extended user interface with profile data
 */
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: UserRole;
  bio?: string;
  avatar_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public: boolean;
  contact_info?: ContactInfo;
  privacy_settings?: PrivacySettings;
  social_media_links?: SocialMediaLinks;
  username: string;
  username_changed?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

/**
 * Privacy settings for user profiles
 */
export interface PrivacySettings {
  show_events_to_goers?: boolean;
  show_pricing_to_goers?: boolean;
  show_profile_to_goers?: boolean;
  show_portfolio_to_goers?: boolean;
  show_contact_info_to_goers?: boolean;
}

/**
 * Social media links structure
 */
export interface SocialMediaLinks {
  tiktok?: string;
  spotify?: string;
  website?: string;
  youtube?: string;
  facebook?: string;
  instagram?: string;
  soundcloud?: string;
}

/**
 * Profile settings for makers
 */
export interface ProfileSettings {
  id: string;
  maker_id: string;
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
  show_on_map: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Secure profile data with visibility filtering applied
 */
export interface SecureProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  bio?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public: boolean;
  contact_info?: ContactInfo;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  loading: boolean;
  error: string | null;
}

  /**
   * Role data hook return type
   */
  export interface RoleData {
    role: UserRole | null;
    loading: boolean;
    error: string | null;
    isOrganizer: boolean;
    isMusician: boolean;
    refresh: () => void;
  }

/**
 * Authentication hook return type
 */
export interface AuthHookReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Re-export Supabase types for convenience
export type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';