import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfileRetry } from './useProfileRetry';

/**
 * Custom hook to handle post-authentication navigation
 * 
 * Manages:
 * - Navigation to dashboard after successful login
 * - First-login feedback flow
 * - Profile creation waiting/retry logic
 * 
 * @returns {Object} Navigation functions
 * @returns {Function} navigateToDashboard - Navigate to user dashboard
 * @returns {Function} shouldShowFeedback - Check if feedback form should be shown
 */
export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const { fetchProfileWithRetry } = useProfileRetry();

  /**
   * Check if the first-login feedback form should be shown
   * 
   * @returns {boolean} True if feedback should be shown
   */
  const shouldShowFeedback = useCallback((): boolean => {
    const feedbackSubmitted = localStorage.getItem('feedback_submitted');
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    
    return hasSeenOnboarding === 'true' && feedbackSubmitted !== 'true';
  }, []);

  /**
   * Navigate to user dashboard after successful authentication
   * 
   * Waits for profile to be created by database trigger if needed,
   * then navigates to the appropriate dashboard URL.
   * 
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<boolean>} True if should show feedback, false otherwise
   */
  const navigateToDashboard = useCallback(
    async (userId: string): Promise<boolean> => {
      // Wait for profile to be created by database trigger
      const profile = await fetchProfileWithRetry(userId);
      
      const dashboardUrl = profile 
        ? `/profile/${profile.user_id}?section=dashboard` 
        : '/auth';

      // Check if first login feedback should be shown
      if (shouldShowFeedback()) {
        return true; // Signal that feedback should be shown
      }

      // Navigate directly to dashboard
      navigate(dashboardUrl, { replace: true });
      return false;
    },
    [navigate, fetchProfileWithRetry, shouldShowFeedback]
  );

  /**
   * Complete feedback and navigate to dashboard
   * 
   * Called after user submits first-login feedback.
   */
  const completeFeedbackAndNavigate = useCallback(async () => {
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
  }, [navigate]);

  return {
    navigateToDashboard,
    shouldShowFeedback,
    completeFeedbackAndNavigate,
  };
};
