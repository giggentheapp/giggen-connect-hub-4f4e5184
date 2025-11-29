import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Bookings = () => {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard?section=bookings');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Laster bookinger...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Bookings;
