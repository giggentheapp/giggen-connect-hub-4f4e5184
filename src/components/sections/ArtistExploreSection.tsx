import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, User, UsersRound, Search, Calendar, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { EventsTicketMarket } from '@/components/EventsTicketMarket';
import { BandExploreTab } from '@/components/BandExploreTab';
import { MakerCard } from '@/components/MakerCard';
import { useExploreMakers } from '@/hooks/useExploreMakers';
import { useDebounce } from '@/hooks/useDebounce';
interface ArtistExploreSectionProps {
  profile: UserProfile;
}
export const ArtistExploreSection = ({
  profile
}: ArtistExploreSectionProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  
  const [activeView, setActiveView] = useState<'map' | 'list' | 'makers' | 'bands' | 'organizers'>('list');
  const [publishedEvents, setPublishedEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Use optimized hooks
  const { makers: allMusicians, loading: musiciansLoading } = useExploreMakers('musician');
  const { makers: allOrganizers, loading: organizersLoading } = useExploreMakers('organizer');
  
  // Debounce search to reduce re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const loading = musiciansLoading || organizersLoading;

  // Check if we should set active view from navigation state
  useEffect(() => {
    if (location.state?.activeView) {
      setActiveView(location.state.activeView);
    }
  }, [location.state]);

  // Auto-fetch published events when component mounts
  useEffect(() => {
    fetchPublishedEvents();
  }, []);
  const fetchPublishedEvents = async () => {
    try {
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
          is_public_after_approval,
          approved_by_sender,
          approved_by_receiver
        `)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true)
        .eq('approved_by_sender', true)
        .eq('approved_by_receiver', true)
        .order('event_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('❌ Error fetching events:', error);
        throw error;
      }

      console.log('✅ Fetched published events:', data?.length || 0);
      setPublishedEvents(data || []);
    } catch (err) {
      console.error('Error fetching published events:', err);
    }
  };

  // Memoized filtered lists - only recompute when data or search changes
  const filteredEvents = useMemo(() => {
    if (!debouncedSearchTerm) return publishedEvents;
    
    return publishedEvents.filter(event =>
      event.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.venue?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [publishedEvents, debouncedSearchTerm]);

  const filteredMakers = useMemo(() => {
    if (!debouncedSearchTerm) return allMusicians;
    
    return allMusicians.filter(maker =>
      maker.display_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.bio?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [allMusicians, debouncedSearchTerm]);

  const filteredOrganizers = useMemo(() => {
    if (!debouncedSearchTerm) return allOrganizers;
    
    return allOrganizers.filter(organizer =>
      organizer.display_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.bio?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [allOrganizers, debouncedSearchTerm]);
  // Memoized handlers to prevent unnecessary re-renders
  const handleViewEvent = useCallback((eventId: string) => {
    window.location.href = `/arrangement/${eventId}`;
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    navigate(`/profile/${userId}`, { 
      state: { fromSection: 'explore' } 
    });
  }, [navigate]);
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Navigation Header - Sticky on mobile */}
      <div className="p-2 md:p-3 bg-background border-b border-border/10 shrink-0 mobile-sticky-header">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Icon Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button
                variant={activeView === 'map' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('map')}
                className="shrink-0"
                title="Kart"
              >
                <MapPin className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('list')}
                className="shrink-0"
                title="Arrangementer"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'makers' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('makers')}
                className="shrink-0"
                title="Musikere"
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'bands' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('bands')}
                className="shrink-0"
                title="Band"
              >
                <UsersRound className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'organizers' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('organizers')}
                className="shrink-0"
                title="Arrangører"
              >
                <Building className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Field */}
            {activeView !== 'map' && (
              <div className="flex-1 min-w-0 max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Søk"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 md:pl-10 text-sm md:text-base h-9 md:h-10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events List View */}
      {activeView === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
              <div className="max-w-4xl mx-auto">
                <EventsTicketMarket />
              </div>
            </div>
          </div>
        </div>
      )}
              
      {/* Makers View */}
      {activeView === 'makers' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p>Laster musikere...</p>
                    </div>
                  </div>
                ) : filteredMakers.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md space-y-2">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">
                        {searchTerm 
                          ? 'Ingen musikere funnet'
                          : 'Ingen musikere registrert'
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMakers.map((maker) => (
                      <MakerCard
                        key={maker.id}
                        maker={maker}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bands View */}
      {activeView === 'bands' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
              <div className="max-w-4xl mx-auto">
                <BandExploreTab searchTerm={searchTerm} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizers View */}
      {activeView === 'organizers' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <Building className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p>Laster arrangører...</p>
                    </div>
                  </div>
                ) : filteredOrganizers.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md space-y-2">
                      <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">
                        {searchTerm 
                          ? 'Ingen arrangører funnet'
                          : 'Ingen arrangører registrert'
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrganizers.map((organizer) => (
                      <MakerCard
                        key={organizer.id}
                        maker={{
                          ...organizer,
                          role: 'ARRANGØR'
                        }}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
