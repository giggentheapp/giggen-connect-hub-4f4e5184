import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthSession } from '@/hooks/useAuthSession';
import { navigateToAuth, navigateToProfile } from '@/lib/navigation';

/**
 * Smart redirect component for /dashboard route
 * 
 * Redirects to profile page if logged in, or to auth if not
 */
const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAuthSession();
  const { user, profile, loading: userLoading } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';

  useEffect(() => {
    if (sessionLoading || userLoading) return;

    if (session?.user && user) {
      // User is logged in - redirect to profile with section
      const userId = profile?.user_id || user.id;
      navigateToProfile(navigate, userId, section, true);
    } else {
      // User not logged in - redirect to auth
      navigateToAuth(navigate, true, 'Redirecting from /dashboard');
    }
  }, [session, sessionLoading, user, userLoading, profile, navigate, section]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default DashboardRedirect;
