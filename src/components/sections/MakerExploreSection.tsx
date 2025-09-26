import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Eye, MessageSquare, Search, Music, Calendar } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { ProfileModal } from '@/components/ProfileModal';
import { useAppTranslation } from '@/hooks/useAppTranslation';
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
  const [activeTab, setActiveTab] = useState('map');
  const [makers, setMakers] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const {
    role
  } = useRole();
  const { t } = useAppTranslation();

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
      setFilteredMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter makers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMakers(makers);
    } else {
      const filtered = makers.filter(maker =>
        maker.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMakers(filtered);
    }
  }, [makers, searchTerm]);
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
  return (
    <div className="w-full h-full bg-background">
      {/* Tab Navigation Header */}
      <div className="p-3 md:p-4 bg-background border-b border-border/10 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('map')}</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('list')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {activeTab === 'list' && (
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('Search Placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Map Tab Content */}
          <TabsContent value="map" className="h-full m-0 p-3 md:p-4">
            <div className="max-w-4xl mx-auto h-full">
              <Card className="h-full flex items-center justify-center">
                <CardContent className="p-8 text-center max-w-2xl">
                  {/* Map Icon */}
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-primary" />
                  </div>

                  {/* Main Title */}
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('mapComingSoon')}</h2>
                  
                  {/* Description */}
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('mapComingSoonDescription')}
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Upcoming Events */}
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{t('upcomingEvents')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('')}
                        </p>
                      </div>
                    </div>

                    {/* Musicians Nearby */}
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{t('musiciansNearby')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('')}
                        </p>
                      </div>
                    </div>

                    {/* Local Community */}
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{t('localVenues')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interim Message */}
                  <p className="text-muted-foreground mb-6">
                    {t('inTheMeantime')}
                  </p>

                  {/* Action Button */}
                  <Button 
                    onClick={() => setActiveTab('list')}
                    size="lg"
                    className="mb-4"
                  >
                    {t('goToExplorePage')}
                  </Button>

                  {/* Status Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <Badge variant="secondary" className="text-xs">
                      {t('underDevelopment')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* List Tab Content */}
          <TabsContent value="list" className="h-full m-0">
            <div className="flex-1 flex flex-col h-full">
              {/* List Header */}
              <div className="px-3 md:px-4 py-3 bg-background border-b border-border/10 shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base md:text-lg font-semibold text-foreground">{t('makersInNetwork')}</h2>
                    <Badge variant="outline" className="text-xs bg-muted">
                      {loading ? '...' : filteredMakers.length}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Main Content Area */}
              <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
                <div className="max-w-4xl mx-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center">
                        <Music className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>{t('Loading Makers')}</p>
                      </div>
                    </div>
                  ) : filteredMakers.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center max-w-md space-y-2">
                        <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">
                          {searchTerm 
                            ? t('No Makers Found Filtered')
                            : t('No Makers Found')
                          }
                        </p>
                        {searchTerm && (
                          <p className="text-sm">
                            {t('Adjust Filters')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      {filteredMakers.map((maker) => (
                        <Card key={maker.id} className="group border bg-background hover:border-primary/50 hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Music className="w-5 h-5 text-primary" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground truncate">
                                      {maker.display_name}
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                      {maker.role}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {maker.bio || t('No Description')}
                                  </p>
                                  
                                  {maker.address && maker.is_address_public && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      <span className="truncate">{maker.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="ml-4">
                                <Button 
                                  onClick={() => handleViewProfile(maker.user_id)} 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-2" />
                                  {t('seeProfile')}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        userId={selectedUserId} 
      />
      
      {/* Booking Request Modal */}
      {bookingMaker && (
        <BookingRequest 
          receiverId={bookingMaker.id} 
          receiverName={bookingMaker.name} 
          onSuccess={() => setBookingMaker(null)} 
        />
      )}
    </div>
  );
};