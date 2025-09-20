import { useState, useEffect } from 'react';
import { MapPin, Users, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import SafeLeafletMap from '@/components/SafeLeafletMap';
import { ProfileModal } from '@/components/ProfileModal';
import { BookingRequest } from '@/components/BookingRequest';
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
interface MakerExploreSectionProps {
  profile: UserProfile;
}
export const MakerExploreSection = ({
  profile
}: MakerExploreSectionProps) => {
  console.log('🎯 MakerExploreSection initialized');
  const [activeTab, setActiveTab] = useState('map');
  const [makers, setMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const {
    role
  } = useRole();

  // Auto-fetch makers when component mounts
  useEffect(() => {
    fetchAllMakers();
  }, []);
  const fetchAllMakers = async () => {
    try {
      setLoading(true);

      // Use new function to get all visible makers
      const {
        data,
        error
      } = await supabase.rpc('get_all_visible_makers');
      if (error) throw error;
      setMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleViewProfile = (makerId: string) => {
    setSelectedUserId(makerId);
    setProfileModalOpen(true);
  };
  const handleStartBooking = (receiverId: string, receiverName: string) => {
    setBookingMaker({
      id: receiverId,
      name: receiverName
    });
  };
  return <div className="fixed inset-0 bg-background">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg border">
          <div className="text-center">
            <h3 className="text-lg font-medium">Kart kommer snart tilbake</h3>
            <p className="text-sm text-muted-foreground">Vi jobber med å forbedre kartopplevelsen</p>
          </div>
        </div>
      </div>
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/95 backdrop-blur-sm border shadow-lg">
            <TabsTrigger value="map">Kart</TabsTrigger>
            <TabsTrigger value="list">Liste</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Floating List Panel */}
      {activeTab === 'list' && <div className="absolute top-20 left-4 right-4 bottom-4 z-10">
          <Card className="h-full bg-card/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-4 h-full overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Makere i nettverket
                </h2>
                <Button onClick={fetchAllMakers} disabled={loading} variant="outline" size="sm">
                  {loading ? 'Laster...' : 'Oppdater makere'}
                </Button>
              </div>
              
              {makers.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{loading ? 'Laster makere...' : 'Ingen makere funnet.'}</p>
                </div> : <div className="space-y-4">
                  {makers.map(maker => <Card key={maker.id} className="border bg-background/80">
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
                                {maker.address && maker.is_address_public && <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {maker.address}
                                  </span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleViewProfile(maker.user_id)} variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Se profil
                            </Button>
                            <Button onClick={() => handleStartBooking(maker.user_id, maker.display_name)} size="sm">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Booking
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </CardContent>
          </Card>
        </div>}
      
      {/* Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} userId={selectedUserId} />
      
      {/* Booking Request Modal */}
      {bookingMaker && <BookingRequest receiverId={bookingMaker.id} receiverName={bookingMaker.name} onSuccess={() => setBookingMaker(null)} />}
    </div>;
};