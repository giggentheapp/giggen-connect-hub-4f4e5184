import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Eye, EyeOff, Settings, ArrowLeft, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConceptCard from '@/components/ConceptCard';
import { useUserConcepts } from '@/hooks/useUserConcepts';

interface ProfileData {
  id: string;
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
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch privacy settings
        const { data: settingsData } = await supabase
          .from('profile_settings')
          .select('*')
          .eq('maker_id', userId)
          .single();

        setSettings(settingsData || {
          show_about: false,
          show_contact: false,
          show_portfolio: false,
          show_techspec: false,
          show_events: false
        });

        // Fetch events if visible
        if (settingsData?.show_events || isOwnProfile) {
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('maker_id', userId)
            .eq('is_public', true)
            .order('event_date', { ascending: true });
          
          setEvents(eventsData || []);
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
        {isOwnProfile && (
          <Button asChild>
            <Link to={`/profile/${userId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Innstillinger
            </Link>
          </Button>
        )}
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