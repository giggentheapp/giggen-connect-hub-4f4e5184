import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { profile, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && profile) {
      navigate(`/profile/${profile.user_id}?section=dashboard`, { replace: true });
    }
  }, [loading, profile, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default DashboardRedirect;
