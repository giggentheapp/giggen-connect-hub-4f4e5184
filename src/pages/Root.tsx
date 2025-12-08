import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthSession } from '@/hooks/useAuthSession';
import { navigateToAuth, navigateToDashboard } from '@/lib/navigation';
import { logger } from '@/utils/logger';

const Root = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAuthSession();
  const { user, profile, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    // Wait for both session and user query to complete
    if (sessionLoading || userLoading) {
      return;
    }

    try {
      // Check session first (source of truth)
      if (session?.user) {
        // Session exists - check if we have profile data
        if (user && profile) {
          // User is logged in, go to dashboard
          navigateToDashboard(navigate, profile.user_id, 'dashboard', true);
        } else if (user && !profile) {
          // User exists but profile doesn't - wait a bit for profile to be created
          const retryTimer = setTimeout(() => {
            // Navigate with userId anyway - profile will be created by trigger
            navigateToDashboard(navigate, user.id, 'dashboard', true);
          }, 1000);
          
          return () => clearTimeout(retryTimer);
        }
      } else {
        // No session - user not logged in
        const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
        
        if (hasSeenOnboarding === 'true') {
          navigateToAuth(navigate, true, 'User not logged in - redirecting from root');
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error) {
      logger.error('Error in root navigation', { error });
      navigateToAuth(navigate, true, 'Error in root navigation');
    }
  }, [sessionLoading, userLoading, session, user, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Root;
