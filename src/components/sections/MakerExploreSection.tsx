import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Eye, MessageSquare, Search, Music } from 'lucide-react';
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
  return <div className="fixed inset-0 bg-background ml-16">
      {/* Coming Soon Map Message */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-card/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-8 text-center">
            {/* Map Icon */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>

            {/* Main Title */}
            <h2 className="text-2xl font-bold text-foreground mb-4">{t('mapComingSoon')}</h2>
            
            {/* Description */}
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('mapDescription')}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Upcoming Events */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t('upcomingEvents')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('upcomingEventsDesc')}
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
                    {t('musiciansNearbyDesc')}
                  </p>
                </div>
              </div>

              {/* Local Community */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t('localCommunity')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('localCommunityDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Interim Message */}
            <p className="text-muted-foreground mb-6">
              {t('interimMessage')}
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
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-2 right-2 md:left-4 md:right-4 z-10">
        <div className="flex items-center gap-2 md:gap-3 max-w-full">
          <div className="flex bg-card/95 backdrop-blur-sm rounded-lg p-1 border shadow-lg flex-shrink-0">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === 'map'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{t('map')}</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{t('list')}</span>
            </button>
          </div>
          
          {activeTab === 'list' && (
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 md:pl-10 bg-card/95 backdrop-blur-sm border shadow-lg text-xs md:text-sm h-8 md:h-10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating List Panel */}
      {activeTab === 'list' && (
        <div className="absolute top-20 md:top-28 left-2 right-2 md:left-4 md:right-4 bottom-20 md:bottom-4 z-10 animate-fade-in">
          <Card className="h-full bg-card/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-semibold">{t('makersInNetwork')}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMakers.length}
                  </Badge>
                </div>
              </div>
              
              {/* List Content */}
              <div className="flex-1 overflow-auto mobile-scroll">
                {filteredMakers.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground px-4">
                    <Music className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">
                      {loading 
                        ? t('loadingMakers')
                        : searchTerm 
                          ? t('noMakersFoundFiltered')
                          : t('noMakersFound')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    {filteredMakers.map((maker) => (
                      <Card key={maker.id} className="group border bg-background/90 hover:border-primary/50 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                                    {maker.display_name}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {maker.role}
                                  </Badge>
                                </div>
                                
                                 <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                                   {maker.bio || t('noDescription')}
                                 </p>
                                
                                {maker.address && maker.is_address_public && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate">{maker.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-2 md:ml-4">
                              <Button 
                                onClick={() => handleViewProfile(maker.user_id)} 
                                variant="outline" 
                                size="sm"
                                className="text-xs min-h-[36px] px-2 md:px-3"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">{t('seeProfile')}</span>
                                <span className="sm:hidden">{t('view')}</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} userId={selectedUserId} />
      
      {/* Booking Request Modal */}
      {bookingMaker && <BookingRequest receiverId={bookingMaker.id} receiverName={bookingMaker.name} onSuccess={() => setBookingMaker(null)} />}
    </div>;
};