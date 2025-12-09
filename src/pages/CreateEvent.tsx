import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventCreateWizard } from '@/components/events/create/EventCreateWizard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { navigateToAuth } from '@/lib/navigation';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigateToAuth(navigate, true, 'User not logged in - redirecting from create event');
    }
  }, [user, userLoading, navigate]);

  // Show loading state while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render wizard if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <EventCreateWizard />
    </div>
  );
};

export default CreateEvent;
