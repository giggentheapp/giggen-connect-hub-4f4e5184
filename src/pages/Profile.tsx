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
        
        // Force fresh data by adding timestamp to bypass any caching
        const timestamp = Date.now();

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
    <div className="container mx-auto p-3 md:p-6 max-w-4xl">
      {/* Header - Compact Mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              <User className="h-6 w-6 sm:h-7 sm:w-7" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{profile.display_name}</h1>
            <Badge variant="outline" className="text-xs">{profile.role}</Badge>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          {!isOwnProfile && profile.role === 'artist' && currentUser && currentUserProfile?.role === 'artist' && (
            <BookingRequest 
              receiverId={profile.user_id} 
              receiverName={profile.display_name} 
            />
          )}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {/* Om meg */}
        {(settings?.show_public_profile || isOwnProfile) && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Om meg
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-foreground leading-relaxed">
                {profile.bio || (isOwnProfile ? "Ingen beskrivelse lagt til." : "Ingen beskrivelse tilgjengelig.")}
              </p>
              
              {profile.social_media_links && (
                <div className="mt-3">
                  <SocialMediaLinks socialLinks={profile.social_media_links} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portefølje */}
        {(settings?.show_public_profile || isOwnProfile) && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <File className="h-4 w-4" />
                Portefølje
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {portfolioLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : Array.isArray(portfolioFiles) && portfolioFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  {portfolioFiles.filter(file => file && file.id && file.file_path).map(file => (
                    <div 
                      key={file.id} 
                      className="group aspect-[4/3] rounded-md overflow-hidden border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => window.open(`https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`, '_blank')}
                    >
                      <div className="relative w-full h-full">
                        {renderFilePreview(file)}
                        {file.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs font-medium truncate">{file.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <File className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ingen portefølje tilgjengelig</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mine publiserte tilbud - PUBLIKUMSVENNLIG */}
        {profile.role === 'artist' && concepts.length > 0 && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                {isOwnProfile ? 'Mine publiserte tilbud' : 'Tilbud'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isOwnProfile ? 'Dine tilbud som er synlige for andre' : 'Publiserte tilbud'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                 {concepts.map((concept) => {
                  const files = conceptFiles[concept.id] || [];
                  return (
                    <Card 
                      key={concept.id} 
                      className="bg-muted/30 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleConceptClick(concept.id)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-base mb-2">{concept.title}</h3>
                        {concept.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{concept.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {concept.price && !concept.door_deal && !concept.price_by_agreement && (
                            <Badge variant="outline" className="text-xs">{concept.price} kr</Badge>
                          )}
                          {concept.door_deal && (
                            <Badge variant="outline" className="text-xs">
                              {concept.door_percentage}% av dørinntekter
                            </Badge>
                          )}
                          {concept.price_by_agreement && (
                            <Badge variant="outline" className="text-xs">Pris ved avtale</Badge>
                          )}
                          {concept.expected_audience && (
                            <Badge variant="outline" className="text-xs">{concept.expected_audience} publikum</Badge>
                          )}
                        </div>

                        {/* Portfolio files preview */}
                        {files.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-xs text-muted-foreground mb-2">Portefølje ({files.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                              {files.slice(0, 3).map((file) => {
                                const fileUrl = file.file_url || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`;
                                return (
                                  <div key={file.id} className="aspect-square rounded overflow-hidden bg-muted">
                                    {file.file_type === 'image' && (
                                      <img src={fileUrl} alt={file.title || file.filename} className="w-full h-full object-cover" />
                                    )}
                                    {file.file_type === 'video' && (
                                      <video src={fileUrl} className="w-full h-full object-cover" muted />
                                    )}
                                    {file.file_type === 'audio' && (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {files.length > 3 && (
                              <p className="text-xs text-muted-foreground mt-2">+{files.length - 3} til</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kommende arrangementer */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {isOwnProfile ? 'Mine Kommende Arrangementer' : 'Kommende Arrangementer'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isOwnProfile ? 'Dine kommende arrangementer og konserter' : 'Publiserte arrangementer'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <WorkingEventsDisplay 
              profile={profile} 
              showSensitiveInfo={isOwnProfile}
              currentUserId={currentUserId}
              viewerRole={currentUserProfile?.role}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
