import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Eye, EyeOff, Settings, ArrowLeft, Lightbulb, Music, File } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConceptCard from '@/components/ConceptCard';
import { BookingRequest } from '@/components/BookingRequest';
import { useUserConcepts } from '@/hooks/useUserConcepts';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';

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
  const { toast } = useToast();
  const { concepts, loading: conceptsLoading } = useUserConcepts(userId);
  const { files: portfolioFiles, loading: portfolioLoading } = useProfilePortfolio(userId);

  const isOwnProfile = currentUser?.id === userId;

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
  }, [userId, currentUser, isOwnProfile, toast]);

  // Separate useEffect for events
  useEffect(() => {
    // Fetch events based on current user and visibility settings
    const fetchEvents = async () => {
      if (!userId) return;

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

    if (settings?.show_events || isOwnProfile) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [userId, isOwnProfile, settings?.show_events]);

  const renderFilePreview = (file: any) => {
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
  };

  if (loading) {
    return <div className="flex justify-center p-8">Laster profil...</div>;
  }

  if (!profile) {
    return <Navigate to="/dashboard" replace />;
  }

  const SectionVisibilityIndicator = ({ isVisible, sectionName }: { isVisible: boolean, sectionName: string }) => (
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
  );

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Om meg */}
        {(settings?.show_about || isOwnProfile) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Om meg
              </CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_about || false} sectionName="Om meg" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profile.bio || "Ingen beskrivelse lagt til"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Kontaktinfo */}
        {(settings?.show_contact || isOwnProfile) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Kontaktinfo
              </CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_contact || false} sectionName="Kontaktinfo" />
            </CardHeader>
            <CardContent>
              {profile.contact_info ? (
                <div className="space-y-2">
                  {profile.contact_info.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{profile.contact_info.email}</span>
                    </div>
                  )}
                  {profile.contact_info.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.contact_info.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Ingen kontaktinfo lagt til</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portefølje */}
        {(settings?.show_portfolio || isOwnProfile) && portfolioFiles && portfolioFiles.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Portefølje
              </CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_portfolio || false} sectionName="Portefølje" />
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <p className="text-muted-foreground">Laster portefølje...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="aspect-[4/3] rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => window.open(`https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/portfolio/${file.file_path}`, '_blank')}
                    >
                      {renderFilePreview(file)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Konsepter */}
        {profile.role === 'maker' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Konsepter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conceptsLoading ? (
                <p className="text-muted-foreground">Laster konsepter...</p>
              ) : concepts.length > 0 ? (
                <div className="space-y-4">
                  {concepts.map((concept) => (
                    <ConceptCard 
                      key={concept.id}
                      concept={concept}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Ingen publiserte konsepter</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kommende arrangementer */}
        {(settings?.show_events || isOwnProfile) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Kommende arrangementer</CardTitle>
              <SectionVisibilityIndicator isVisible={settings?.show_events || false} sectionName="Arrangementer" />
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {event.event_date && (
                          <CardDescription>
                            {new Date(event.event_date).toLocaleDateString('no-NO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-2">
                            📍 {event.location}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Ingen kommende arrangementer</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;