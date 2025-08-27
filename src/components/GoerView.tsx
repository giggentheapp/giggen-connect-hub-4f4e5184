import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
  created_at: string;
  updated_at: string;
  default_mode?: string;
  current_mode?: string;
}

interface GoerViewProps {
  profile: UserProfile;
  onModeChange: (newMode: string) => void;
}

export const GoerView = ({ profile, onModeChange }: GoerViewProps) => {
  const [visibleMakers, setVisibleMakers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadVisibleMakers();
  }, []);

  const loadVisibleMakers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_settings!profile_settings_maker_id_fkey(show_on_map)
        `)
        .eq('role', 'maker')
        .not('address', 'is', null)
        .not('latitude', 'is', null) 
        .not('longitude', 'is', null);

      if (error) throw error;

      // Filter to only show makers who have enabled showing on map
      const visibleProfiles = profiles?.filter(maker => 
        maker.profile_settings?.show_on_map === true
      ) || [];

      setVisibleMakers(visibleProfiles);
    } catch (error) {
      console.error('Error loading visible makers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Laster makere...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">GIGGEN</h1>
              <p className="text-sm text-muted-foreground">
                Velkommen, {profile.display_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/events">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Se alle arrangementer
                </Button>
              </Link>
              <ModeSwitcher profile={profile} onModeChange={onModeChange} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 space-y-8">
          
          {/* Find GiggenMakers Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Finn GiggenMakers</h2>
              <Link to="/goer-map">
                <Button className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Se kart
                </Button>
              </Link>
            </div>

            {visibleMakers.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleMakers.slice(0, 6).map((maker) => (
                    <Card key={maker.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={maker.avatar_url || ''} alt={maker.display_name} />
                          <AvatarFallback>
                            {maker.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium truncate">
                            {maker.display_name}
                          </CardTitle>
                          {maker.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{maker.address}</span>
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {maker.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {maker.bio}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {visibleMakers.length > 6 && (
                  <div className="flex justify-center mt-6">
                    <Link to="/goer-map">
                      <Button variant="outline">
                        Se alle {visibleMakers.length} makere på kartet
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Ingen makere er synlige på kartet for øyeblikket.
                  </p>
                  <Link to="/goer-map">
                    <Button>
                      Åpne kart likevel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};