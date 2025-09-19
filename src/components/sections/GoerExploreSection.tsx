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

export const GoerExploreSection = ({ profile, viewMode = 'list', exploreType = 'makers' }: GoerExploreSectionProps) => {
  const [makers, setMakers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'map' | 'list'>(viewMode);
  const [currentFilter, setCurrentFilter] = useState<'makers' | 'events'>(exploreType);
  const navigate = useNavigate();
  const { isGoer } = useRole();

  // AGGRESSIVE DEBUGGING - Track component lifecycle
  const mountTime = useState(() => Date.now())[0];
  console.log('🚀 GoerExploreSection MOUNT/RENDER:', { 
    mountTime,
    currentTime: Date.now(),
    timeDiff: Date.now() - mountTime,
    currentViewMode, 
    currentFilter, 
    viewMode, 
    exploreType,
    profile: profile?.display_name 
  });

  // Track when component unmounts
  useEffect(() => {
    console.log('🎬 GoerExploreSection MOUNTED at:', Date.now());
    return () => {
      console.log('💀 GoerExploreSection UNMOUNTING at:', Date.now());
    };
  }, []);

  // Track every single re-render
  useEffect(() => {
    console.log('🔄 GoerExploreSection RE-RENDER:', {
      currentViewMode,
      currentFilter,
      propsViewMode: viewMode,
      propsExploreType: exploreType
    });
  });

  // Auto-fetch data when component mounts
  useEffect(() => {
    fetchMakers();
    fetchEvents();
  }, []);

  // Ensure state doesn't get overridden by props after initial mount
  useEffect(() => {
    console.log('🔧 Props changed:', { viewMode, exploreType });
    // Don't reset state if user has already interacted with toggles
  }, [viewMode, exploreType]);

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
      {/* AGGRESSIVE TEST - SIMPLE BUTTON THAT MUST STAY VISIBLE */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 99999,
          background: 'red',
          color: 'white',
          padding: '10px',
          border: '3px solid black',
          display: 'block',
          visibility: 'visible'
        }}
      >
        <button 
          onClick={() => console.log('🚨 TEST BUTTON CLICKED')}
          style={{ background: 'red', color: 'white', padding: '5px', border: 'none' }}
        >
          I SHOULD ALWAYS BE VISIBLE - TEST BUTTON
        </button>
      </div>

      {/* FORCED ALWAYS-VISIBLE TOGGLES */}
      <div 
        className="fixed top-4 left-4 right-4 z-[99999] flex gap-4"
        style={{
          position: 'fixed',
          top: '60px',
          left: '10px',
          zIndex: 99998,
          display: 'block',
          visibility: 'visible'
        }}
      >
        <div 
          className="flex items-center gap-4"
          style={{
            background: 'white',
            border: '3px solid blue',
            padding: '10px',
            display: 'flex',
            visibility: 'visible'
          }}
        >
          {/* View Mode Toggle - FORCED VISIBLE */}
          <div style={{ background: 'yellow', padding: '5px', border: '2px solid green' }}>
            <button
              onClick={() => {
                console.log('🔄 FORCED View Mode Toggle: switching to map');
                setCurrentViewMode('map');
              }}
              style={{
                background: currentViewMode === 'map' ? 'blue' : 'gray',
                color: 'white',
                padding: '8px',
                margin: '2px',
                border: 'none'
              }}
            >
              KART
            </button>
            <button
              onClick={() => {
                console.log('🔄 FORCED View Mode Toggle: switching to list');
                setCurrentViewMode('list');
              }}
              style={{
                background: currentViewMode === 'list' ? 'blue' : 'gray',
                color: 'white',
                padding: '8px',
                margin: '2px',
                border: 'none'
              }}
            >
              LISTE
            </button>
          </div>
          
          {/* Filter Toggle - FORCED VISIBLE */}
          <div style={{ background: 'orange', padding: '5px', border: '2px solid purple' }}>
            <button
              onClick={() => {
                console.log('🔄 FORCED Filter Toggle: switching to makers');
                setCurrentFilter('makers');
              }}
              style={{
                background: currentFilter === 'makers' ? 'purple' : 'gray',
                color: 'white',
                padding: '8px',
                margin: '2px',
                border: 'none'
              }}
            >
              MAKERE
            </button>
            <button
              onClick={() => {
                console.log('🔄 FORCED Filter Toggle: switching to events');
                setCurrentFilter('events');
              }}
              style={{
                background: currentFilter === 'events' ? 'purple' : 'gray',
                color: 'white',
                padding: '8px',
                margin: '2px',
                border: 'none'
              }}
            >
              EVENTS
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Map - NO CONDITIONS */}
      <div className="absolute inset-0">
        <MapBackground 
          onProfileClick={(makerId) => {
            console.log('🗺️ MapBackground: onProfileClick triggered with makerId:', makerId);
            handleViewProfile(makerId);
          }}
          filterType={currentFilter}
        />
      </div>
      
      {/* Fixed Controls - Top - ALWAYS VISIBLE */}
      <div className="fixed top-4 left-4 right-4 z-[9999] flex gap-4">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-white border-2 border-primary shadow-xl rounded-lg p-2">
            <Button
              variant={currentViewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 View Mode Toggle: switching to map');
                setCurrentViewMode('map');
              }}
              className="flex items-center gap-1 min-w-[80px]"
            >
              <Map className="w-4 h-4" />
              Kart
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 View Mode Toggle: switching to list');
                setCurrentViewMode('list');
              }}
              className="flex items-center gap-1 min-w-[80px]"
            >
              <List className="w-4 h-4" />
              Liste
            </Button>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex gap-1 bg-white border-2 border-secondary shadow-xl rounded-lg p-2">
            <Button
              variant={currentFilter === 'makers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 Filter Toggle: switching to makers');
                setCurrentFilter('makers');
              }}
              className="min-w-[80px]"
            >
              Makere
            </Button>
            <Button
              variant={currentFilter === 'events' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('🔄 Filter Toggle: switching to events');
                setCurrentFilter('events');
              }}
              className="min-w-[80px]"
            >
              Events
            </Button>
          </div>
        </div>
      </div>

      {/* List Panel */}
      {currentViewMode === 'list' && (
        <div className="absolute top-24 left-4 right-4 bottom-4 z-10">
          <Card className="h-full bg-card/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-4 h-full overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {currentFilter === 'makers' ? (
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
                  onClick={currentFilter === 'makers' ? fetchMakers : fetchEvents} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Laster...' : 'Oppdater'}
                </Button>
              </div>
              
              {currentFilter === 'makers' ? (
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