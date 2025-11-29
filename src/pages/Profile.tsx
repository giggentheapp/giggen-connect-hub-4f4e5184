import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, profile: currentUserProfile } = useCurrentUser();
  const { profile, loading } = useProfile(userId);

  const currentUserId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profil ikke funnet</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <UnifiedSidePanel profile={profile as any} isOwnProfile={isOwnProfile} currentUserId={currentUserId} />;
};

export default Profile;
