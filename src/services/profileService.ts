import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UserProfile {
  user: User | null;
  profile: ProfileRow | null;
}

export const profileService = {
  /**
   * Get the currently authenticated user and their profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        logger.error('Failed to get current user', { error: authError });
        throw authError;
      }

      if (!user) {
        return { user: null, profile: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        logger.error('Failed to fetch user profile', { userId: user.id, error: profileError });
        // Don't throw - gracefully return user without profile
        return { user, profile: null };
      }

      return { user, profile };
    } catch (error) {
      logger.error('Error in getCurrentUser', { error });
      return { user: null, profile: null };
    }
  },

  /**
   * Get a profile by user ID
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - not an error, just return null
          return null;
        }
        logger.error('Failed to fetch profile', { userId, error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getProfile', { userId, error });
      throw error;
    }
  },

  /**
   * Get a secure profile using RPC function (respects privacy settings)
   */
  async getSecureProfile(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_secure_profile_data', {
          target_user_id: userId
        });

      if (error) {
        logger.error('Failed to fetch secure profile', { userId, error });
        throw error;
      }

      // RPC returns an array, get first element
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      logger.error('Error in getSecureProfile', { userId, error });
      throw error;
    }
  },

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<ProfileRow> {
    try {
      logger.business('Updating profile', { userId, updates });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update profile', { userId, updates, error });
        throw error;
      }

      logger.business('Profile updated successfully', { userId });

      return data;
    } catch (error) {
      logger.error('Error in updateProfile', { userId, updates, error });
      throw error;
    }
  },
};
