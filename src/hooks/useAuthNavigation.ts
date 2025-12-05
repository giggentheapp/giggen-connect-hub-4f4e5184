import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to handle post-authentication navigation
 * 
 * Manages:
 * - Navigation to dashboard after successful login
 * - First-login feedback flow
 * - Profile creation waiting/retry logic
 * - Loading state during navigation
 * 
 * @returns {Object} Navigation functions and state
 * @returns {Function} navigateToDashboard - Navigate to user dashboard
 * @returns {Function} completeFeedbackAndNavigate - Complete feedback and navigate to dashboard
 * @returns {boolean} isNavigating - Whether navigation is in progress
 */
export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Check for profile with retry logic
   * 
   * Waits for profile to be created by database trigger if needed.
   * Retries up to 3 times with 400ms delay between attempts.
   * 
   * @param {string} userId - The user ID to fetch profile for
   * @returns {Promise<{ user_id: string } | null>} The profile or null
   */
  const checkProfileWithRetry = useCallback(async (userId: string) => {
    let profile = null;
    let retries = 0;
    const maxRetries = 3;
    
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
      
      await new Promise(resolve => setTimeout(resolve, 400));
      retries++;
    }
    
    return profile;
  }, []);

  /**
   * Navigate to user dashboard after successful authentication
   * Only navigates if user is on /auth page - preserves current location otherwise
   * 
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<boolean>} True if should show feedback, false if already navigated
   */
  const navigateToDashboard = useCallback(async (userId: string): Promise<boolean> => {
    // Only redirect if user is currently on auth page
    const currentPath = window.location.pathname;
    if (currentPath !== '/auth' && currentPath !== '/') {
      return false; // User is already on a valid page, don't redirect
    }
    
    setIsNavigating(true);
    
    try {
      const profile = await checkProfileWithRetry(userId);
      const dashboardUrl = profile 
        ? `/profile/${profile.user_id}?section=dashboard` 
        : '/auth';
      
      const feedbackSubmitted = localStorage.getItem('feedback_submitted');
      const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
      
      // Return true if we should show feedback, false if we should navigate
      if (hasSeenOnboarding === 'true' && feedbackSubmitted !== 'true') {
        return true; // Show feedback
      } else {
        navigate(dashboardUrl, { replace: true });
        return false; // Already navigated
      }
    } finally {
      setIsNavigating(false);
    }
  }, [navigate, checkProfileWithRetry]);

  /**
   * Complete feedback and navigate to dashboard
   * 
   * Called after user submits first-login feedback.
   */
  const completeFeedbackAndNavigate = useCallback(async () => {
    setIsNavigating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        const dashboardUrl = profile 
          ? `/profile/${profile.user_id}?section=dashboard` 
          : '/auth';
        navigate(dashboardUrl);
      }
    } finally {
      setIsNavigating(false);
    }
  }, [navigate]);

  return { 
    navigateToDashboard, 
    completeFeedbackAndNavigate,
    isNavigating 
  };
};
