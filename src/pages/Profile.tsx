import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Eye, File, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingRequest } from '@/components/BookingRequest';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { WorkingEventsDisplay } from '@/components/WorkingEventsDisplay';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useNavigate } from 'react-router-dom';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  contact_info: any;
  avatar_url: string | null;
  role: 'artist' | 'audience';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  social_media_links?: any;
  created_at: string;
  updated_at: string;
}

interface ProfileSettings {
  show_public_profile: boolean;
  show_on_map: boolean;
  show_contact: boolean;
}

const Profile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [conceptFiles, setConceptFiles] = useState<Record<string, any[]>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { files: portfolioFiles, loading: portfolioLoading } = useProfilePortfolio(userId);

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
        
        // Clear existing concepts before fetching to prevent stale data
        setConcepts([]);
        setConceptFiles({});
        
        // Force fresh data by adding timestamp to bypass any caching
        const timestamp = Date.now();
        console.log('🔄 Fetching profile at:', timestamp);

        // Use get_public_profile RPC which checks show_public_profile setting
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_public_profile', { target_user_id: userId })
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        // If display_name is NULL, profile is private (for artists without show_public_profile)
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

          const typedOwnProfile = {
            ...ownProfileData,
            role: ownProfileData.role as 'artist' | 'audience'
          } as ProfileData;

          setProfile(typedOwnProfile);
        } else {
          // Use public profile data
          const typedProfileData = {
            ...profileData,
            role: profileData.role as 'artist' | 'audience',
            updated_at: profileData.created_at
          } as ProfileData;

          setProfile(typedProfileData);
        }

        // Fetch settings
        if (profileData.role === 'artist') {
          const { data: settingsData } = await supabase
            .from('profile_settings')
            .select('*')
            .eq('maker_id', userId)
            .maybeSingle();
          
          setSettings(settingsData || {
            show_public_profile: false,
            show_on_map: false,
            show_contact: false
          });

          // Fetch published concepts (tilbud) - KUN SYNLIGE
          // Add timestamp to force fresh query and bypass cache
          const { data: conceptsData, error: conceptsError } = await supabase
            .from('concepts')
            .select('id, title, description, price, expected_audience, door_deal, door_percentage, price_by_agreement, is_published, updated_at')
            .eq('maker_id', userId)
            .eq('is_published', true)
            .order('updated_at', { ascending: false });

          console.log('📋 PROFILE CONCEPTS LOADED:', {
            userId,
            isOwnProfile,
            conceptsError,
            totalFound: conceptsData?.length || 0,
            timestamp: new Date().toISOString(),
            concepts: conceptsData?.map(c => ({
              title: c.title,
              is_published: c.is_published,
              id: c.id
            }))
          });

          if (conceptsError) {
            console.error('❌ Error loading concepts:', conceptsError);
          }
          
          setConcepts(conceptsData || []);

          // Fetch portfolio files for each published concept
          if (conceptsData && conceptsData.length > 0) {
            const filesMap: Record<string, any[]> = {};
            for (const concept of conceptsData) {
              const { data: filesData } = await supabase
                .from('concept_files')
                .select('*')
                .eq('concept_id', concept.id)
                .order('created_at', { ascending: false });
              filesMap[concept.id] = filesData || [];
            }
            setConceptFiles(filesMap);
          }
        } else {
          setSettings({
            show_public_profile: true,
            show_on_map: false,
            show_contact: false
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    
    // Add event listener to refetch when navigating back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, currentUser]);

  const renderFilePreview = useCallback((file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`;
    
    if (file.file_type === 'image') {
      return <img src={publicUrl} alt={file.title || file.filename} className="w-full h-full object-cover" loading="lazy" />;
    } else if (file.file_type === 'video') {
      return <video src={publicUrl} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />;
    }
    return <div className="w-full h-full bg-muted flex items-center justify-center">
      <File className="h-8 w-8 text-muted-foreground" />
    </div>;
  }, []);

  const handleConceptClick = (conceptId: string) => {
    navigate(`/profile/${userId}/concept/${conceptId}`);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Laster profil...</div>;
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

  return (
    <>
      <div className="container mx-auto p-3 md:p-6 max-w-4xl pb-20 md:pb-6">
        {/* Header - Compact Mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
...
        </Card>
        </div>
      </div>
      
      <MobileNavigation />
    </>
  );
};

export default Profile;
