import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Configuration options for profile retry logic
 */
interface ProfileRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Custom hook to fetch user profile with retry logic
 * 
 * Useful for handling race conditions where a user profile might not be immediately
 * available after signup (waiting for database trigger to complete).
 * 
 * @param {ProfileRetryOptions} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 400)
 * 
 * @returns {Object} Profile fetching function
 * @returns {Function} fetchProfileWithRetry - Function to fetch profile with retry logic
 */
export const useProfileRetry = (options: ProfileRetryOptions = {}) => {
  const { maxRetries = 3, retryDelay = 400 } = options;

  /**
   * Fetch a user profile with automatic retry logic
   * 
   * @param {string} userId - The user ID to fetch profile for
   * @returns {Promise<{ user_id: string } | null>} The profile data or null if not found
   */
  const fetchProfileWithRetry = useCallback(
    async (userId: string): Promise<{ user_id: string } | null> => {
      let profile = null;
      let retries = 0;

      while (!profile && retries < maxRetries) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileData) {
          profile = profileData;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries++;
      }

      return profile;
    },
    [maxRetries, retryDelay]
  );

  return { fetchProfileWithRetry };
};
