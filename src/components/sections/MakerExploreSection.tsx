import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Eye, MessageSquare } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/Map';

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

interface MakerExploreSectionProps {
  profile: UserProfile;
}

export const MakerExploreSection = ({ profile }: MakerExploreSectionProps) => {
  const [activeTab, setActiveTab] = useState('map');
  const [makers, setMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { ismaker } = useRole();

  const fetchOtherMakers = async () => {
    if (!ismaker) return; // Only makers can see other makers
    
    try {
      setLoading(true);
      
      // Use secure function to get only public maker profiles
      const { data, error } = await supabase
        .rpc('get_public_makers_for_explore');
      
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

  const handleStartBooking = (receiverId: string) => {
    // Navigate to booking creation with pre-filled receiver
    console.log('Starting booking with maker:', receiverId);
    // This would typically navigate to a booking creation page
  };

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="map">Kart</TabsTrigger>
          <TabsTrigger value="list">Nettverk</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="flex-1 mt-0">
          <div className="h-[calc(100vh-200px)]">
            <Map className="w-full h-full rounded-lg border" />
          </div>
        </TabsContent>

        <TabsContent value="list" className="flex-1 mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Makere i nettverket
              </h2>
              <Button 
                onClick={fetchOtherMakers} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Laster...' : 'Last inn makere'}
              </Button>
            </div>
            
            {makers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen andre makere funnet. Trykk "Last inn makere" for å se nettverket.</p>
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
                              {maker.address && maker.is_address_public && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {maker.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewProfile(maker.user_id)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Se profil
                          </Button>
                          <Button
                            onClick={() => handleStartBooking(maker.user_id)}
                            size="sm"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};