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
import { BandExploreTab } from '@/components/BandExploreTab';
import { MakerCard } from '@/components/MakerCard';
interface ArtistExploreSectionProps {
  profile: UserProfile;
}
export const ArtistExploreSection = ({
  profile
}: ArtistExploreSectionProps) => {
  const location = useLocation();
  const [activeView, setActiveView] = useState<'map' | 'list' | 'makers' | 'bands' | 'organizers'>('list');
  const [publishedEvents, setPublishedEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [makers, setMakers] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState<any[]>([]);
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

  // Auto-fetch published events, makers and organizers when component mounts
  useEffect(() => {
    fetchPublishedEvents();
    fetchMakers();
    fetchOrganizers();
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

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      console.log('🎪 Fetching organizers...');

      // Fetch profiles with role 'organizer' from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'organizer');

      if (roleError) {
        console.error('❌ Error fetching organizer roles:', roleError);
        throw roleError;
      }

      const organizerIds = roleData?.map(r => r.user_id) || [];

      if (organizerIds.length === 0) {
        console.log('✅ No organizers found');
        setOrganizers([]);
        setFilteredOrganizers([]);
        return;
      }

      // Fetch profiles for organizers
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', organizerIds);

      if (error) {
        console.error('❌ Error fetching organizer profiles:', error);
        throw error;
      }

      console.log('✅ Fetched organizers:', data?.length || 0);
      setOrganizers(data || []);
      setFilteredOrganizers(data || []);
    } catch (err) {
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter events, makers and organizers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEvents(publishedEvents);
      setFilteredMakers(makers);
      setFilteredOrganizers(organizers);
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
        maker.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMakers(filteredMkrs);

      const filteredOrgs = organizers.filter(organizer =>
        organizer.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizers(filteredOrgs);
    }
  }, [publishedEvents, makers, organizers, searchTerm]);
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
                <Users className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'bands' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('bands')}
                className="shrink-0"
                title="Band"
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant={activeView === 'organizers' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setActiveView('organizers')}
                className="shrink-0"
                title="Arrangører"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Field */}
            {activeView !== 'map' && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMakers.map((maker) => (
                      <MakerCard
                        key={maker.id}
                        maker={maker}
                        onViewProfile={(userId) => navigate(`/profile/${userId}`)}
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
                <BandExploreTab />
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
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p>Laster arrangører...</p>
                    </div>
                  </div>
                ) : filteredOrganizers.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center max-w-md space-y-2">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                        onViewProfile={(userId) => navigate(`/profile/${userId}`)}
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
