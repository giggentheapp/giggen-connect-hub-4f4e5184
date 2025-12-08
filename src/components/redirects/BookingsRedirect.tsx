import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthSession } from '@/hooks/useAuthSession';
import { navigateToAuth } from '@/lib/navigation';

/**
 * Smart redirect component for /bookings route
 * 
 * Redirects to profile bookings section if logged in, or to auth if not
 */
const BookingsRedirect = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAuthSession();
  const { user, profile, loading: userLoading } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (sessionLoading || userLoading) return;

    if (session?.user && user) {
      // User is logged in - redirect to profile bookings section
      const userId = profile?.user_id || user.id;
      const url = tab 
        ? `/profile/${userId}?section=bookings&tab=${tab}` 
        : `/profile/${userId}?section=bookings`;
      navigate(url, { replace: true });
    } else {
      // User not logged in - redirect to auth
      navigateToAuth(navigate, true, 'Redirecting from /bookings');
    }
  }, [session, sessionLoading, user, userLoading, profile, navigate, tab]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default BookingsRedirect;
