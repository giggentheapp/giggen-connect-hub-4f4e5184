import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventCreateWizard } from '@/components/events/create/EventCreateWizard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';
import { navigateToAuth } from '@/lib/navigation';
import { BackgroundArtwork } from '@/components/BackgroundArtwork';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const { profile } = useProfile(user?.id);

  useEffect(() => {
    if (!userLoading && !user) {
      navigateToAuth(navigate, true, 'User not logged in - redirecting from create event');
    }
  }, [user, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundArtwork imagePaths={(profile as any)?.dashboard_background_images} />
      <div className="relative z-10">
        <EventCreateWizard />
      </div>
    </div>
  );
};

export default CreateEvent;
