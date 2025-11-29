import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { logger } from '@/utils/logger';

const Root = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    try {
      if (user && profile) {
        // User is logged in, go to dashboard
        navigate(`/profile/${profile.user_id}?section=dashboard`, { replace: true });
      } else {
        // User not logged in, check onboarding
        const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
        
        if (hasSeenOnboarding === 'true') {
          navigate('/auth', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (error) {
      logger.error('Error in root navigation', { error });
      navigate('/auth', { replace: true });
    }
  }, [loading, user, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Root;
