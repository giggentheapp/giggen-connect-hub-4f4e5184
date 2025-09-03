import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Settings, 
  ArrowLeft, 
  Lightbulb, 
  Music, 
  File, 
  Calendar, 
  MapPin, 
  Users 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ConceptCard from '@/components/ConceptCard';
import { BookingRequest } from '@/components/BookingRequest';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { ProfileTechSpecsViewer } from '@/components/ProfileTechSpecsViewer';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  contact_info?: any;
  avatar_url?: string;
  role: string;
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
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const { toast } = useToast();
  const { concepts, loading: conceptsLoading } = useUserConcepts(userId);
  const { files: portfolioFiles, loading: portfolioLoading } = useProfilePortfolio(userId);

  const currentUserId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (!profileData) {
          console.warn('No profile found for user ID:', userId);
          return; // Don't show error, just redirect to dashboard
        }
        
        setProfile(profileData);

        // Fetch privacy settings only if user is a maker
        if (profileData.role === 'maker') {
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
        } else {
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
        console.error('Error fetching profile:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste profil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Separate useEffect for events
  useEffect(() => {
    // Fetch events based on current user and visibility settings
    const fetchEvents = async () => {
      if (!userId || !currentUserId) return;

      const isOwnProfile = currentUserId === userId;

      try {
        let query = supabase
          .from('events')
          .select('*')
          .eq('maker_id', userId)
          .order('event_date', { ascending: true });

        // If viewing own profile, show all events
        // If viewing others, only show public events  
        if (!isOwnProfile) {
          query = query.eq('is_public', true);
        }

        const { data: eventsData } = await query;
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    const isOwnProfile = currentUserId === userId;
    if (settings?.show_events || isOwnProfile) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [userId, currentUserId, settings?.show_events]);

  const renderFilePreview = useCallback((file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`;
    
    if (file.file_type === 'image') {
      return (
        <img 
          src={publicUrl} 
          alt={file.title || file.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    } else if (file.file_type === 'video') {
      return (
        <video 
          src={publicUrl}
          className="w-full h-full object-cover"
          muted
          loop
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
        />
      );
    } else if (file.file_type === 'audio') {
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <File className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    }
  }, []);

  const SectionVisibilityIndicator = useCallback(({ isVisible, sectionName }: { isVisible: boolean, sectionName: string }) => (
    isOwnProfile ? (
      <div className="flex items-center gap-2 mb-2">
        {isVisible ? (
          <Badge variant="default" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Offentlig
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            <EyeOff className="h-3 w-3 mr-1" />
            Skjult
          </Badge>
        )}
      </div>
    ) : null
  ), [isOwnProfile]);

  if (loading) {
    return <div className="flex justify-center p-8">Laster profil...</div>;
  }

  if (!profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
          {!isOwnProfile && profile.role === 'maker' && currentUser && (
            <BookingRequest 
              receiverId={profile.user_id}
              receiverName={profile.display_name}
            />
          )}
          {isOwnProfile && (
            <Button asChild>
              <Link to={`/profile/${userId}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Innstillinger
              </Link>
            </Button>
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
              <SectionVisibilityIndicator isVisible={settings?.show_about || false} sectionName="Om meg" />
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {profile.bio || (isOwnProfile ? "Ingen beskrivelse lagt til. Legg til en beskrivelse i innstillingene." : "Ingen beskrivelse tilgjengelig.")}
              </p>
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
              <SectionVisibilityIndicator isVisible={settings?.show_portfolio || false} sectionName="Portefølje" />
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Laster portefølje...</span>
                </div>
              ) : Array.isArray(portfolioFiles) && portfolioFiles.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioFiles.filter(file => file && file.id && file.file_path).map((file) => (
                    <div 
                      key={file.id} 
                      className="group aspect-[4/3] rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => window.open(`https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`, '_blank')}
                    >
                      <div className="relative w-full h-full">
                        {renderFilePreview(file)}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
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
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Ingen portefølje lagt til ennå. Last opp filer i innstillingene." 
                      : "Ingen portefølje tilgjengelig"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Konsepter - Only visible when Maker views Maker profile */}
        {profile.role === 'maker' && currentUser?.role === 'maker' && (
          <Card>
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
              {conceptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Laster konsepter...</span>
                </div>
              ) : Array.isArray(concepts) && concepts.length > 0 ? (
                <div className="space-y-6">
                  {concepts.filter(concept => concept && concept.id).map((concept) => (
                    <ConceptCard 
                      key={concept.id}
                      concept={concept}
                      showActions={false}
                      showConceptActions={!isOwnProfile}
                      onConceptAction={(action) => {
                        if (action === 'deleted' || action === 'rejected') {
                          window.location.reload();
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Ingen publiserte konsepter ennå. Opprett ditt første konsept i dashboardet." 
                      : "Ingen publiserte konsepter"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kommende arrangementer - Only visible when Goer views Maker profile */}
        {profile.role === 'maker' && currentUser?.role === 'goer' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kommende arrangementer
              </CardTitle>
              <CardDescription>
                Arrangementene til denne makeren
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Laster arrangementer...</span>
                </div>
              ) : Array.isArray(events) && events.length > 0 ? (
                <div className="space-y-4">
                  {events.filter(event => event && event.id).map((event) => (
                    <div 
                      key={event.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        {event.is_public && (
                          <Badge variant="secondary" className="text-xs">Offentlig</Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {event.event_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.event_date), 'dd.MM.yyyy', { locale: nb })}</span>
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {event.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Maks {event.max_participants} deltakere</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Ingen kommende arrangementer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bookinger - Only visible when Maker views their own or another Maker's profile */}
        {profile.role === 'maker' && currentUser?.role === 'maker' && (
          <Card>
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
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;