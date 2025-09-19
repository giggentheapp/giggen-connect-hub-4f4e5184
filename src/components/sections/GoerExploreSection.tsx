import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Clock, Eye, Filter, Map, List } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate } from 'react-router-dom';
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
  const [makers, setMakers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'map' | 'list'>('map'); // Default to map
  const [currentFilter, setCurrentFilter] = useState<'makers' | 'events'>('makers');
  const navigate = useNavigate();
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
    console.log('🎯 GoerExploreSection: handleViewProfile called with makerId:', makerId);
    console.log('🎯 Current navigate function:', navigate);
    console.log('🎯 About to navigate to:', `/profile/${makerId}`);
    
    // Navigate directly to profile page instead of modal
    navigate(`/profile/${makerId}`);
    
    console.log('✅ GoerExploreSection: navigate() call completed');
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* FLOATING TOGGLE BUTTON - TOP RIGHT - AGGRESSIVE DEBUG VISIBILITY */}
      <div 
        className="fixed top-4 right-4 flex gap-2"
        style={{
          zIndex: 99999,
          position: 'fixed',
          isolation: 'isolate'
        }}
      >
        {/* DEBUG INDICATOR */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'lime',
          color: 'black',
          padding: '2px 6px',
          fontSize: '10px',
          zIndex: 100000,
          border: '1px solid black'
        }}>
          DEBUG ON
        </div>

        {/* View Toggle Button - MAXIMUM VISIBILITY */}
        <button
          onClick={() => setCurrentViewMode(currentViewMode === 'map' ? 'list' : 'map')}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            background: 'red',
            color: 'white',
            border: '3px solid black',
            padding: '15px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
            cursor: 'pointer',
            minWidth: '120px',
            minHeight: '50px'
          }}
        >
          {currentViewMode === 'map' ? '🗂️ LISTE' : '🗺️ KART'}
        </button>

        {/* Filter Toggle Button - MAXIMUM VISIBILITY */}
        <button
          onClick={() => setCurrentFilter(currentFilter === 'makers' ? 'events' : 'makers')}
          style={{
            position: 'fixed',
            top: '20px',
            right: '160px',
            zIndex: 99999,
            background: 'blue',
            color: 'white',
            border: '3px solid black',
            padding: '15px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
            cursor: 'pointer',
            minWidth: '120px',
            minHeight: '50px'
          }}
        >
          {currentFilter === 'makers' ? '📅 EVENTS' : '🎭 MAKERE'}
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="absolute inset-0">
        {currentViewMode === 'map' ? (
          /* MAP VIEW */
          <MapBackground 
            onProfileClick={(makerId) => handleViewProfile(makerId)}
            filterType={currentFilter}
          />
        ) : (
          /* LIST VIEW */
          <div className="absolute inset-0 bg-background overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  {currentFilter === 'makers' ? (
                    <>
                      <Users className="w-6 h-6" />
                      Makere i nettverket
                    </>
                  ) : (
                    <>
                      <Calendar className="w-6 h-6" />
                      Kommende arrangementer
                    </>
                  )}
                </h2>
                <Button 
                  onClick={currentFilter === 'makers' ? fetchMakers : fetchEvents} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Laster...' : 'Oppdater'}
                </Button>
              </div>
              
              {currentFilter === 'makers' ? (
                /* MAKERS LIST */
                makers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{loading ? 'Laster makere...' : 'Ingen makere funnet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {makers.map((maker) => (
                      <Card key={maker.id} className="border bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={() => handleViewProfile(maker.user_id)}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                              {maker.avatar_url ? (
                                <img 
                                  src={maker.avatar_url} 
                                  alt={maker.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-muted-foreground text-lg font-bold">
                                  {maker.display_name?.charAt(0) || 'M'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold">{maker.display_name}</h3>
                              <p className="text-muted-foreground mt-1">
                                {maker.bio || 'Ingen beskrivelse tilgjengelig'}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  {maker.role}
                                </Badge>
                                {maker.address && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
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
                /* EVENTS LIST */
                events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{loading ? 'Laster arrangementer...' : 'Ingen arrangementer funnet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <Card key={event.id} className="border bg-card hover:bg-card/80 cursor-pointer transition-colors" onClick={() => handleViewEvent(event.id)}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            {event.description && (
                              <p className="text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              {event.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {event.venue}
                                </span>
                              )}
                              {event.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(event.date).toLocaleDateString('nb-NO')}
                                </span>
                              )}
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                            {event.ticket_price && (
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-sm">
                                  {event.ticket_price} kr
                                </Badge>
                                {event.expected_audience && (
                                  <Badge variant="secondary" className="text-sm">
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
            </div>
          </div>
        )}
      </div>
      
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