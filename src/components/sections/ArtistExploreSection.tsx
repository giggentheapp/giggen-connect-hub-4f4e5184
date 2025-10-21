import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Search, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { EventsTicketMarket } from '@/components/EventsTicketMarket';
interface ArtistExploreSectionProps {
  profile: UserProfile;
}
export const ArtistExploreSection = ({
  profile
}: ArtistExploreSectionProps) => {
  const location = useLocation();
  const [activeView, setActiveView] = useState<'map' | 'list' | 'makers'>('list');
  const [publishedEvents, setPublishedEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [makers, setMakers] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { t } = useAppTranslation();
  const navigate = useNavigate();

  // Check if we should set active view from navigation state
  useEffect(() => {
    if (location.state?.activeView) {
      setActiveView(location.state.activeView);
    }
  }, [location.state]);

  // Auto-fetch published events and makers when component mounts
  useEffect(() => {
    fetchPublishedEvents();
    fetchMakers();
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
      console.log('📋 Events data:', JSON.stringify(data, null, 2));
      console.log('🔍 First event:', data?.[0]);
      setPublishedEvents(data || []);
      setFilteredEvents(data || []);
    } catch (err) {
      console.error('Error fetching published events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMakers = async () => {
    try {
      setLoading(true);
      console.log('👥 Fetching public makers...');

      // Use RPC function to get only artists with show_public_profile enabled
      const { data, error } = await supabase
        .rpc('get_public_artists_for_explore');

      if (error) {
        console.error('❌ Error fetching makers:', error);
        throw error;
      }

      console.log('✅ Fetched public makers:', data?.length || 0);
      setMakers(data || []);
      setFilteredMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter events and makers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEvents(publishedEvents);
      setFilteredMakers(makers);
    } else {
      const filteredEvts = publishedEvents.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filteredEvts);

      const filteredMkrs = makers.filter(maker =>
        maker.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMakers(filteredMkrs);
    }
  }, [publishedEvents, makers, searchTerm]);
  const handleViewEvent = (eventId: string) => {
    // Navigate to public event view
    window.location.href = `/arrangement/${eventId}`;
  };
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Navigation Header - Sticky on mobile */}
      <div className="p-2 md:p-3 bg-background border-b border-border/10 shrink-0 mobile-sticky-header">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Icon Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'map' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('map')}
                className="shrink-0"
              >
                <MapPin className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('list')}
                className="shrink-0"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'makers' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('makers')}
                className="shrink-0"
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Field */}
            {(activeView === 'list' || activeView === 'makers') && (
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Søk"
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

      {/* Events List View */}
      {activeView === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* List Header */}
            <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0 mobile-sticky-header" style={{ top: '56px' }}>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Kommende arrangementer</h2>
                  <Badge variant="outline" className="text-xs bg-muted">
                    {loading ? '...' : filteredEvents.length}
                  </Badge>
                </div>
              </div>
            </div>

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
            {/* List Header */}
            <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0 mobile-sticky-header" style={{ top: '56px' }}>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Artister og arrangører</h2>
                  <Badge variant="outline" className="text-xs bg-muted">
                    {loading ? '...' : filteredMakers.length}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-3 md:p-4 pb-24 md:pb-4 min-h-0">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p>Laster makers...</p>
                    </div>
                  </div>
                ) : filteredMakers.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md space-y-2">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">
                        {searchTerm 
                          ? 'Ingen makers funnet'
                          : 'Ingen makers registrert'
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
                  <div className="mt-8 space-y-3 animate-fade-in">
                    {filteredMakers.map((maker) => (
                      <Card 
                        key={maker.id} 
                        className="hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/profile/${maker.user_id}`)}
                      >
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {maker.avatar_url ? (
                                <img 
                                  src={maker.avatar_url} 
                                  alt={maker.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">
                                {maker.display_name}
                              </h3>
                              {maker.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {maker.bio}
                                </p>
                              )}
                              {maker.address && maker.is_address_public && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="truncate">{maker.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
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
