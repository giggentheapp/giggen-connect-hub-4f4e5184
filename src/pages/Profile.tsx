import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProfile } from '@/hooks/useProfile';
import { useAuthSession } from '@/hooks/useAuthSession';
import { navigateToAuth } from '@/lib/navigation';

const Profile = () => {
  const { userId: rawUserId } = useParams();
  const navigate = useNavigate();
  
  // Clean userId - remove query parameters and hash fragments
  // Fixes bug where userId contains "?section=dashboard" causing 400 errors
  const userId = useMemo(() => {
    if (!rawUserId) return undefined;
    return rawUserId.split('?')[0].split('#')[0].trim();
  }, [rawUserId]);
  
  const { user: currentUser, profile: currentUserProfile, loading: userLoading } = useCurrentUser();
  const { session, loading: sessionLoading } = useAuthSession();
  const { profile, loading } = useProfile(userId);

  // Redirect to auth if not logged in
  // Check session first (source of truth) - prevents redirect loops during login
  useEffect(() => {
    if (sessionLoading) return; // Wait for session check
    if (!session) {
      navigateToAuth(navigate, true, 'No session - redirecting from profile');
    }
  }, [session, sessionLoading, navigate]);

  const currentUserId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);

  // Wait for session check before showing anything
  if (sessionLoading || loading) {
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
