import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Eye, EyeOff, Settings, ArrowLeft, Lightbulb, Music, File, Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConceptCard from '@/components/ConceptCard';
import { BookingRequest } from '@/components/BookingRequest';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { ProfileTechSpecsViewer } from '@/components/ProfileTechSpecsViewer';
import { WorkingEventsDisplay } from '@/components/WorkingEventsDisplay';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  contact_info: any;
  avatar_url: string | null;
  role: 'maker' | 'goer';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
}
interface ProfileSettings {
  show_about: boolean;
  show_contact: boolean;
  show_portfolio: boolean;
  show_techspec: boolean;
  show_events: boolean;
}
const Profile = () => {
  console.log('📄 Profile component: Starting render/re-render');
  const {
    userId
  } = useParams();
  console.log('📄 Profile: userId from params:', userId);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const {
    toast
  } = useToast();
  const {
    concepts,
    loading: conceptsLoading
  } = useUserConcepts(userId);
  const {
    files: portfolioFiles,
    loading: portfolioLoading
  } = useProfilePortfolio(userId);
  const currentUserId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);
  useEffect(() => {
    console.log('📄 Profile: getCurrentUser useEffect triggered');
    const getCurrentUser = async () => {
      console.log('📄 Profile: Getting current user...');
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      console.log('📄 Profile: Current user fetched:', user?.id);
      setCurrentUser(user);

      // Also get current user's profile to check role
      if (user?.id) {
        const {
          data: profileData
        } = await supabase.rpc('get_secure_profile_data', {
          target_user_id: user.id
        }).maybeSingle();
        console.log('📄 Profile: Current user profile:', profileData);
        setCurrentUserProfile(profileData);
      }
    };
    getCurrentUser();
  }, []);
  useEffect(() => {
    console.log('📄 Profile: fetchProfile useEffect triggered for userId:', userId);
    const fetchProfile = async () => {
      if (!userId) {
        console.log('📄 Profile: No userId provided, returning early');
        return;
      }
      try {
        console.log('📄 Profile: Fetching profile data for userId:', userId);
        console.log('📄 Profile: Current user is:', currentUser?.id, 'with email:', currentUser?.email);

        // Fetch profile data using secure function that handles visibility
        const {
          data: profileData,
          error: profileError
        } = await supabase.rpc('get_secure_profile_data', {
          target_user_id: userId
        }).maybeSingle();
        console.log('📄 Profile: RPC response - data:', profileData, 'error:', profileError);
        if (profileError) {
          console.error('📄 Profile: Error fetching profile:', profileError);
          throw profileError;
        }
        if (!profileData) {
          console.warn('📄 Profile: No profile data returned from RPC for user ID:', userId);
          console.warn('📄 Profile: This could mean the profile doesn\'t exist or isn\'t visible to current user');
          return; // Don't show error, just show not found message
        }
        console.log('📄 Profile: Profile data fetched successfully:', profileData);

        // Cast the role to proper type since RPC returns string
        const typedProfileData = {
          ...profileData,
          role: profileData.role as 'maker' | 'goer'
        } as ProfileData;
        setProfile(typedProfileData);

        // Fetch privacy settings only if user is a maker
        if (profileData.role === 'maker') {
          console.log('📄 Profile: Fetching settings for maker');
          const {
            data: settingsData
          } = await supabase.from('profile_settings').select('*').eq('maker_id', userId).maybeSingle();
          console.log('📄 Profile: Settings fetched:', settingsData);
          setSettings(settingsData || {
            show_about: false,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false
          });
        } else {
          console.log('📄 Profile: Setting default visibility for goer profile');
          // For goers, set default visibility settings
          setSettings({
            show_about: true,
            show_contact: false,
            show_portfolio: false,
            show_techspec: false,
            show_events: false
          });
        }
      } catch (error: any) {
        console.error('📄 Profile: Error in fetchProfile:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste profil",
          variant: "destructive"
        });
      } finally {
        console.log('📄 Profile: fetchProfile completed, setting loading to false');
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  // Events are now handled by UpcomingEventsSection component

  const renderFilePreview = useCallback((file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`;
    if (file.file_type === 'image') {
      return <img src={publicUrl} alt={file.title || file.filename} className="w-full h-full object-cover" loading="lazy" />;
    } else if (file.file_type === 'video') {
      return <video src={publicUrl} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />;
    } else if (file.file_type === 'audio') {
      return <div className="w-full h-full bg-muted flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>;
    } else {
      return <div className="w-full h-full bg-muted flex items-center justify-center">
          <File className="h-8 w-8 text-muted-foreground" />
        </div>;
    }
  }, []);
  const SectionVisibilityIndicator = useCallback(({
    isVisible,
    sectionName
  }: {
    isVisible: boolean;
    sectionName: string;
  }) => isOwnProfile ? <div className="flex items-center gap-2 mb-2">
        {isVisible ? <Badge variant="default" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Offentlig
          </Badge> : <Badge variant="secondary" className="text-xs">
            <EyeOff className="h-3 w-3 mr-1" />
            Skjult
          </Badge>}
      </div> : null, [isOwnProfile]);
  if (loading) {
    console.log('📄 Profile: Rendering loading state');
    return <div className="flex justify-center p-8">Laster profil...</div>;
  }
  if (!profile) {
    console.log('📄 Profile: No profile found, showing not found message');
    return <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til oversikt
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profil ikke funnet</h2>
              <p className="text-muted-foreground">
                Brukerprofilen du leter etter eksisterer ikke eller er ikke tilgjengelig.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  console.log('📄 Profile: Rendering profile for:', profile.display_name, profile.role);
  return <div className="container mx-auto p-6 max-w-4xl">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til oversikt
          </Link>
        </Button>
      </div>

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
          {!isOwnProfile && profile.role === 'maker' && currentUser && currentUserProfile?.role === 'maker' && <BookingRequest receiverId={profile.user_id} receiverName={profile.display_name} />}
          {!isOwnProfile && profile.role === 'maker' && currentUser && currentUserProfile?.role === 'goer' && <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              Se offentlig profil
            </Button>}
          {isOwnProfile && <Button asChild>
              <Link to={`/profile/${userId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Innstillinger
              </Link>
            </Button>}
        </div>
      </div>

      <div className="space-y-8">
        {/* Om meg */}
        {(settings?.show_about || isOwnProfile) && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Om meg
              </CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_about || false} sectionName="Om meg" />
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {profile.bio || (isOwnProfile ? "Ingen beskrivelse lagt til. Legg til en beskrivelse i innstillingene." : "Ingen beskrivelse tilgjengelig.")}
              </p>
            </CardContent>
          </Card>}

        {/* Portefølje */}
        {(settings?.show_portfolio || isOwnProfile) && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Portefølje
              </CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_portfolio || false} sectionName="Portefølje" />
            </CardHeader>
            <CardContent>
              {portfolioLoading ? <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Laster portefølje...</span>
                </div> : Array.isArray(portfolioFiles) && portfolioFiles.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioFiles.filter(file => file && file.id && file.file_path).map(file => <div key={file.id} className="group aspect-[4/3] rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => window.open(`https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`, '_blank')}>
                      <div className="relative w-full h-full">
                        {renderFilePreview(file)}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        {file.title && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-white text-sm font-medium truncate">{file.title}</p>
                          </div>}
                      </div>
                    </div>)}
                </div> : <div className="text-center py-12">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Ingen portefølje lagt til ennå. Last opp filer i innstillingene." : settings?.show_portfolio ? "Ingen offentlige porteføljefiler" : "Portefølje er ikke offentlig"}
                  </p>
                </div>}
            </CardContent>
          </Card>}

        {/* Konsepter - Only visible when Maker views Maker profile */}
        {profile.role === 'maker' && currentUser?.role === 'maker' && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Konsepter
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Dine publiserte konsepter" : "Publiserte konsepter"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conceptsLoading ? <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Laster konsepter...</span>
                </div> : Array.isArray(concepts) && concepts.length > 0 ? <div className="space-y-6">
                  {concepts.filter(concept => concept && concept.id).map(concept => <ConceptCard key={concept.id} concept={concept} showActions={false} showConceptActions={!isOwnProfile} onConceptAction={action => {
              if (action === 'deleted' || action === 'rejected') {
                window.location.reload();
              }
            }} />)}
                </div> : <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Ingen publiserte konsepter ennå. Opprett ditt første konsept i dashboardet." : "Ingen publiserte konsepter"}
                  </p>
                </div>}
            </CardContent>
          </Card>}

        {/* Kommende arrangementer - Show for both own profile and when viewing others */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isOwnProfile ? 'Mine Kommende Arrangementer' : 'Kommende Arrangementer'}
              
            </CardTitle>
            <CardDescription>
              {isOwnProfile ? 'Dine kommende arrangementer og konserter' : 'Publiserte arrangementer fra denne makeren'}
              
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkingEventsDisplay profile={profile} showSensitiveInfo={isOwnProfile} />
          </CardContent>
        </Card>

        {/* Bookinger - Only visible when Maker views their own or another Maker's profile */}
        {profile.role === 'maker' && currentUser?.role === 'maker' && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookinger
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Dine bookinger" : `Bookinger med ${profile.display_name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Bookingfunksjonalitet vil bli implementert
                </p>
              </div>
            </CardContent>
          </Card>}
      </div>
    </div>;
};
export default Profile;