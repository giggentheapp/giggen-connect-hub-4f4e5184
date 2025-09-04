import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Clock, Eye, Filter } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';
import { MapBackground } from '@/components/MapBackground';
import { ProfileModal } from '@/components/ProfileModal';
import { EventModal } from '@/components/EventModal';

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
  viewMode?: 'map' | 'list';
  exploreType?: 'makers' | 'events';
}

export const GoerExploreSection = ({ profile, viewMode = 'map', exploreType = 'makers' }: GoerExploreSectionProps) => {
  const [filterType, setFilterType] = useState<'all' | 'makers' | 'events'>('all');
  const [makers, setMakers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { isGoer } = useRole();

  // Auto-fetch data when component mounts
  useEffect(() => {
    fetchMakers();
    fetchEvents();
  }, []);

  const fetchMakers = async () => {    
    try {
      setLoading(true);
      
      // Use new function to get all visible makers
      const { data, error } = await supabase
        .rpc('get_all_visible_makers');
      
      if (error) throw error;
      setMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events_market')
        .select('*')
        .eq('is_public', true)
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (makerId: string) => {
    setSelectedUserId(makerId);
    setProfileModalOpen(true);
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <MapBackground 
          onProfileClick={handleViewProfile}
          filterType={filterType}
        />
      </div>
      
      {/* Fixed Filter Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex gap-1 bg-card/95 backdrop-blur-sm border shadow-lg rounded-md p-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Alle
          </Button>
          <Button
            variant={filterType === 'makers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('makers')}
          >
            Makere
          </Button>
          <Button
            variant={filterType === 'events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('events')}
          >
            Events
          </Button>
        </div>
      </div>

      {/* List Panel */}
      {viewMode === 'list' && (
        <div className="absolute top-4 left-4 right-4 bottom-4 z-10">
          <Card className="h-full bg-card/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-4 h-full overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {exploreType === 'makers' ? (
                    <>
                      <Users className="w-5 h-5" />
                      Makere i nettverket
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Kommende arrangementer
                    </>
                  )}
                </h2>
                <Button 
                  onClick={exploreType === 'makers' ? fetchMakers : fetchEvents} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Laster...' : 'Oppdater'}
                </Button>
              </div>
              
              {exploreType === 'makers' ? (
                makers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{loading ? 'Laster makere...' : 'Ingen makere funnet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {makers.map((maker) => (
                      <Card key={maker.id} className="border bg-background/80 cursor-pointer hover:bg-background/90 transition-colors" onClick={() => handleViewProfile(maker.user_id)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                              {maker.avatar_url ? (
                                <img 
                                  src={maker.avatar_url} 
                                  alt={maker.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-foreground text-sm font-bold">
                                  {maker.display_name?.charAt(0) || 'M'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{maker.display_name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                                {maker.bio || 'Ingen beskrivelse tilgjengelig'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{loading ? 'Laster arrangementer...' : 'Ingen arrangementer funnet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <Card key={event.id} className="border bg-background/80 cursor-pointer hover:bg-background/90 transition-colors" onClick={() => handleViewEvent(event.id)}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-medium">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {event.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.venue}
                                </span>
                              )}
                              {event.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(event.date).toLocaleDateString('nb-NO')}
                                </span>
                              )}
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                            {event.ticket_price && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {event.ticket_price} kr
                                </Badge>
                                {event.expected_audience && (
                                  <Badge variant="secondary" className="text-xs">
                                    {event.expected_audience} publikummere
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUserId}
      />
      
      {/* Event Modal */}
      <EventModal 
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        eventId={selectedEventId}
      />
    </div>
  );
};