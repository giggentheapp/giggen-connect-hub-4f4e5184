import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  created_at: string;
  updated_at: string;
}

interface GoerDashboardProps {
  profile: UserProfile;
}

export const GoerDashboard = ({ profile }: GoerDashboardProps) => {
  const [visibleMakers, setVisibleMakers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Force component refresh to clear any cached Eye icon references

  useEffect(() => {
    loadVisibleMakers();
  }, []);

  const loadVisibleMakers = async () => {
    try {
      // Load makers with addresses that are visible on map
      const { data: makersData, error: makersError } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_settings!inner(show_on_map)
        `)
        .eq('role', 'maker')
        .eq('profile_settings.show_on_map', true)
        .not('address', 'is', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (makersError) throw makersError;
      setVisibleMakers(makersData || []);

    } catch (error: any) {
      toast({
        title: "Feil ved lasting av makere",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laster makere...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Finn GiggenMakers</h2>
        <p className="text-muted-foreground">
          Utforsk makere i ditt område ved å åpne kartet
        </p>
      </div>

      {/* Map Quick Action */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Map className="h-6 w-6" />
            Kart over makere
          </CardTitle>
          <CardDescription>
            Se alle makere som har valgt å være synlige på kartet
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link 
            to="/map" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            <Map className="w-5 h-5 mr-2" />
            Åpne kart
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            {visibleMakers.length} makere venter på å bli oppdaget
          </p>
        </CardContent>
      </Card>

      {/* Visible Makers Preview */}
      {visibleMakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Makere på kartet
            </CardTitle>
            <CardDescription>
              Her er noen av makerne du kan finne på kartet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleMakers.slice(0, 6).map((maker) => (
                <div key={maker.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    {maker.avatar_url ? (
                      <img 
                        src={maker.avatar_url} 
                        alt={maker.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                        {maker.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{maker.display_name}</h4>
                      {maker.address && (
                        <p className="text-xs text-muted-foreground">{maker.address}</p>
                      )}
                    </div>
                  </div>
                  {maker.bio && (
                    <p className="text-sm text-muted-foreground">{maker.bio}</p>
                  )}
                </div>
              ))}
            </div>
            {visibleMakers.length > 6 && (
              <div className="text-center mt-4">
                <Link 
                  to="/map" 
                  className="text-sm text-primary hover:underline"
                >
                  Se alle {visibleMakers.length} makere på kartet →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visibleMakers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Ingen makere på kartet ennå</h3>
            <p className="text-muted-foreground">
              Det er ingen makere som har valgt å være synlige på kartet for øyeblikket.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};