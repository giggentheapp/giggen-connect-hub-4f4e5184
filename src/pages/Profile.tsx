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
import { ConceptViewModal } from '@/components/ConceptViewModal';

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
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
}

const Profile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
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
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_secure_profile_data', { target_user_id: userId })
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) return;

        const typedProfileData = {
          ...profileData,
          role: profileData.role as 'artist' | 'audience',
          updated_at: profileData.created_at
        } as ProfileData;
        
        setProfile(typedProfileData);

        // Fetch settings
        if (profileData.role === 'artist') {
          const { data: settingsData } = await supabase
            .from('profile_settings')
            .select('*')
            .eq('maker_id', userId)
            .maybeSingle();
          
          setSettings(settingsData || {
            show_about: false,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false
          });

          // Fetch published concepts (tilbud) - KUN GRUNNLEGGENDE FELTER
          const { data: conceptsData } = await supabase
            .from('concepts')
            .select('id, title, description, price, expected_audience, door_deal, door_percentage, price_by_agreement')
            .eq('maker_id', userId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          
          setConcepts(conceptsData || []);
        } else {
          setSettings({
            show_about: true,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste profil",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

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
    setSelectedConceptId(conceptId);
    setIsConceptModalOpen(true);
  };

  const handleConceptModalClose = () => {
    setIsConceptModalOpen(false);
    setSelectedConceptId(null);
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
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <Badge variant="outline">{profile.role}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isOwnProfile && profile.role === 'artist' && currentUser && currentUserProfile?.role === 'artist' && (
            <BookingRequest 
              receiverId={profile.user_id} 
              receiverName={profile.display_name} 
            />
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Om meg */}
        {(settings?.show_about || isOwnProfile) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Om meg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {profile.bio || (isOwnProfile ? "Ingen beskrivelse lagt til." : "Ingen beskrivelse tilgjengelig.")}
              </p>
              
              {profile.social_media_links && (
                <div className="mt-4">
                  <SocialMediaLinks socialLinks={profile.social_media_links} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portefølje */}
        {(settings?.show_portfolio || isOwnProfile) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Portefølje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : Array.isArray(portfolioFiles) && portfolioFiles.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioFiles.filter(file => file && file.id && file.file_path).map(file => (
                    <div 
                      key={file.id} 
                      className="group aspect-[4/3] rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => window.open(`https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`, '_blank')}
                    >
                      <div className="relative w-full h-full">
                        {renderFilePreview(file)}
                        {file.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-white text-sm font-medium truncate">{file.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ingen portefølje tilgjengelig</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mine publiserte tilbud - PUBLIKUMSVENNLIG */}
        {profile.role === 'artist' && concepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {isOwnProfile ? 'Mine publiserte tilbud' : 'Tilbud'}
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? 'Dine tilbud som er synlige for andre' : 'Publiserte tilbud'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {concepts.map((concept) => (
                  <Card 
                    key={concept.id} 
                    className="bg-muted/30 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleConceptClick(concept.id)}
                  >
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-2">{concept.title}</h3>
                      {concept.description && (
                        <p className="text-muted-foreground mb-4">{concept.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {concept.price && !concept.door_deal && !concept.price_by_agreement && (
                          <Badge variant="outline">{concept.price} kr</Badge>
                        )}
                        {concept.door_deal && (
                          <Badge variant="outline">
                            {concept.door_percentage}% av dørinntekter
                          </Badge>
                        )}
                        {concept.price_by_agreement && (
                          <Badge variant="outline">Pris ved avtale</Badge>
                        )}
                        {concept.expected_audience && (
                          <Badge variant="outline">{concept.expected_audience} publikum</Badge>
                        )}
                      </div>

                      {/* VIKTIG: Tech specs og hospitality vises IKKE lenger her */}
                      {/* Disse skal kun være tilgjengelig etter booking-godkjenning */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kommende arrangementer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isOwnProfile ? 'Mine Kommende Arrangementer' : 'Kommende Arrangementer'}
            </CardTitle>
            <CardDescription>
              {isOwnProfile ? 'Dine kommende arrangementer og konserter' : 'Publiserte arrangementer'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkingEventsDisplay 
              profile={profile} 
              showSensitiveInfo={isOwnProfile}
              currentUserId={currentUserId}
              viewerRole={currentUserProfile?.role}
            />
          </CardContent>
        </Card>
      </div>

      {/* Concept View Modal */}
      {selectedConceptId && (
        <ConceptViewModal
          isOpen={isConceptModalOpen}
          onClose={handleConceptModalClose}
          conceptIds={[selectedConceptId]}
          initialConceptIndex={0}
          showConceptActions={false}
          viewMode="public"
        />
      )}
    </div>
  );
};

export default Profile;
