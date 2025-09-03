import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Clock, Eye } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';

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
}

interface GoerExploreSectionProps {
  profile: UserProfile;
}

export const GoerExploreSection = ({ profile }: GoerExploreSectionProps) => {
  const [activeTab, setActiveTab] = useState('map');
  const [makers, setMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isGoer } = useRole();

  const fetchMakers = async () => {
    if (!isGoer) return; // Only goers can see makers
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'maker')
        .eq('is_address_public', true);
      
      if (error) throw error;
      setMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (makerId: string) => {
    window.open(`/profile/${makerId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">Kart</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Utforsk makere på kart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Kartvisning vises som bakgrunn. Bruk kartfunksjonene for å utforske makere i ditt område.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Makere i ditt område
              </CardTitle>
              <Button 
                onClick={fetchMakers} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Laster...' : 'Last inn makere'}
              </Button>
            </CardHeader>
            <CardContent>
              {makers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen makere funnet. Trykk "Last inn makere" for å se tilgjengelige utøvere.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {makers.map((maker) => (
                    <Card key={maker.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-sm font-bold">
                                {maker.display_name?.charAt(0) || 'M'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium">{maker.display_name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {maker.bio || 'Ingen beskrivelse tilgjengelig'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {maker.role}
                                </Badge>
                                {maker.address && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {maker.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleViewProfile(maker.user_id)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Se profil
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};