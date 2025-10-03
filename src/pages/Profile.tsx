import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { UnifiedSidePanel } from '@/components/UnifiedSidePanel';
import { UserProfile } from '@/types/auth';

const Profile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user?.id) {
        const { data: profileData } = await supabase
          .rpc('get_secure_profile_data', { target_user_id: user.id })
          .maybeSingle();
        setCurrentUserProfile(profileData);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const isOwnProfile = currentUser?.id === userId;

        // Use get_public_profile RPC which checks show_public_profile setting
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_public_profile', { target_user_id: userId })
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        // If display_name is NULL, profile is private
        if (!profileData || (!profileData.display_name && !isOwnProfile)) {
          console.log('Profile is private or not found');
          setProfile(null);
          setLoading(false);
          return;
        }

        // If own profile, fetch full data directly
        if (isOwnProfile) {
          const { data: ownProfileData, error: ownError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (ownError) throw ownError;
          setProfile(ownProfileData as UserProfile);
        } else {
          // Use public profile data
          setProfile(profileData as UserProfile);
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, currentUser]);

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

  return <UnifiedSidePanel profile={profile} isOwnProfile={isOwnProfile} />;
};

export default Profile;
