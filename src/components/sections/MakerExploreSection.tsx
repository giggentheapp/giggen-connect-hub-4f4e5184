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
import { MobileProfileCard } from '@/components/MobileProfileCard';
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
  const [activeTab, setActiveTab] = useState('list');
  const [publishedEvents, setPublishedEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const {
    role
  } = useRole();
  const { t } = useAppTranslation();

  // Auto-fetch published events when component mounts
  useEffect(() => {
    fetchPublishedEvents();
  }, []);
  const fetchPublishedEvents = async () => {
    try {
      setLoading(true);
      console.log('🎭 Fetching published upcoming events...');

      // Fetch published upcoming events from bookings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          title,
          description,
          venue,
          address,
          event_date,
          time,
          ticket_price,
          audience_estimate,
          sender_id,
          receiver_id,
          status,
          is_public_after_approval
        `)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching events:', error);
        throw error;
      }

      console.log('✅ Fetched published events:', data?.length || 0);
      setPublishedEvents(data || []);
      setFilteredEvents(data || []);
    } catch (err) {
      console.error('Error fetching published events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEvents(publishedEvents);
    } else {
      const filtered = publishedEvents.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [publishedEvents, searchTerm]);
  const handleViewEvent = (eventId: string) => {
    // Navigate to event details page
    window.location.href = `/booking/${eventId}/summary`;
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
                    <h2 className="text-base md:text-lg font-semibold text-foreground">Kommende Arrangementer</h2>
                    <Badge variant="outline" className="text-xs bg-muted">
                      {loading ? '...' : filteredEvents.length}
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
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>Laster arrangementer...</p>
                      </div>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center max-w-md space-y-2">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">
                          {searchTerm 
                            ? 'Ingen arrangementer funnet'
                            : 'Ingen kommende arrangementer'
                          }
                        </p>
                        {searchTerm && (
                          <p className="text-sm">
                            Prøv et annet søk
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      {filteredEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="group border bg-background hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => handleViewEvent(event.id)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Event Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground truncate">
                                      {event.title}
                                    </h3>
                                    <Badge variant="secondary" className="shrink-0">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {event.event_date && new Date(event.event_date).toLocaleDateString('no-NO', { 
                                        day: 'numeric', 
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </Badge>
                                  </div>
                                  
                                  {event.time && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Kl. {event.time}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Event Description */}
                              {event.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Event Location */}
                              {(event.venue || event.address) && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-1 shrink-0" />
                                  <span className="truncate">
                                    {event.venue}
                                    {event.venue && event.address && ', '}
                                    {event.address}
                                  </span>
                                </div>
                              )}

                              {/* Event Details */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {event.ticket_price && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.ticket_price} kr
                                  </Badge>
                                )}
                                {event.audience_estimate && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    {event.audience_estimate} publikum
                                  </Badge>
                                )}
                              </div>

                              {/* View Button */}
                              <div className="pt-2">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewEvent(event.id);
                                  }}
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                >
                                  <Eye className="w-3 h-3 mr-2" />
                                  Se detaljer
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
      
      {/* Mobile Profile Card - Sticky bottom */}
      {profileCardUserId && (
        <MobileProfileCard 
          userId={profileCardUserId}
          onClose={() => setProfileCardUserId(null)}
        />
      )}
      
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