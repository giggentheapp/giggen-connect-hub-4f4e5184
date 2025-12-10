import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BandViewModal } from '@/components/BandViewModal';
import { useBandData } from '@/hooks/useBandData';
import { useBandPermissions } from '@/hooks/useBandPermissions';
import { useQueryParams } from '@/hooks/useQueryParams';
import { BandEditForm } from '@/components/band/BandEditForm';
import { BandCreateForm } from '@/components/band/BandCreateForm';
import { BandView } from '@/components/band/BandView';
import { navigateBack, navigateToProfile, navigateToAuth } from '@/lib/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';
import { BackgroundArtwork } from '@/components/BackgroundArtwork';

const BandProfile = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getParam } = useQueryParams();
  const { user } = useCurrentUser();
  const { profile } = useProfile(user?.id);

  const isCreateMode = bandId === 'new';
  const { band, members, loading, refetch } = useBandData(isCreateMode ? undefined : bandId);
  const { currentUserRole, isAdmin, isMember, currentUserId } = useBandPermissions(
    bandId,
    members
  );

  const [isEditing, setIsEditing] = useState(false);
  const forcePublicView = getParam('view') === 'public';

  const handleBack = () => {
    const fromSection = location.state?.fromSection;
    if (user) {
      if (fromSection) {
        navigateToProfile(navigate, user.id, fromSection, false);
      } else {
        navigateToProfile(navigate, user.id, 'admin-bands', false);
      }
    } else {
      navigateToAuth(navigate, true, 'User not logged in - redirecting from band profile');
    }
  };

  // Public view for non-admins
  if (!loading && band && (forcePublicView || (isMember && !isAdmin))) {
    return (
      <BandViewModal 
        open={true} 
        onClose={() => {
          if (user) {
            navigateToProfile(navigate, user.id, 'admin-bands', false);
          } else {
            navigateBack(navigate, location, '/');
          }
        }} 
        band={band} 
        showContactInfo={false} 
      />
    );
  }

  // Loading state
  if (loading && !isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Not found
  if (!band && !isCreateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Band ikke funnet</p>
            <Button onClick={handleBack}>Tilbake til dashbord</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create mode
  if (isCreateMode) {
    return (
      <BandCreateForm
        onSuccess={() => {
          if (user) {
            navigateToProfile(navigate, user.id, 'admin-bands', false);
          } else {
            navigateToAuth(navigate, true, 'User not logged in - redirecting from band profile');
          }
        }}
        onCancel={handleBack}
      />
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <BandEditForm
        band={band!}
        onSuccess={() => {
          setIsEditing(false);
          refetch();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // View mode
  return (
    <div className="min-h-screen relative">
      <BackgroundArtwork imagePaths={(profile as any)?.dashboard_background_images} />
      <div className="relative z-10">
        <BandView
          band={band!}
          members={members}
          currentUserRole={currentUserRole}
          isAdmin={isAdmin}
          isMember={isMember}
          currentUserId={currentUserId}
          onEdit={() => setIsEditing(true)}
          onBack={handleBack}
          onRefetch={refetch}
        />
      </div>
    </div>
  );
};

export default BandProfile;
