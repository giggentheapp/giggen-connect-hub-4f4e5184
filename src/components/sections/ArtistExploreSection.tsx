import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, User, UsersRound, Search, Calendar, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { ExploreCard, ExploreGrid } from '@/components/explore';
import { useBands } from '@/hooks/useBands';
import { useBandPortfolios } from '@/hooks/useBandPortfolios';
import { useExploreMakers } from '@/hooks/useExploreMakers';
import { useDebounce } from '@/hooks/useDebounce';
import { useEvents } from '@/hooks/useTickets';
import { useProfilePortfolio } from '@/hooks/useProfilePortfolio';
import { motion } from 'framer-motion';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingMaker, setBookingMaker] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Use optimized hooks
  const { makers: allMusicians, loading: musiciansLoading } = useExploreMakers('musician');
  const { makers: allOrganizers, loading: organizersLoading } = useExploreMakers('organizer');
  const { bands, loading: bandsLoading } = useBands();
  const { data: events, isLoading: eventsLoading } = useEvents();
  
  // Batch fetch band portfolios
  const bandIds = useMemo(() => bands.map(b => b.id), [bands]);
  const { data: portfoliosByBandId = {} } = useBandPortfolios(bandIds);
  
  // Debounce search to reduce re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check if we should set active view from navigation state and restore scroll
  useEffect(() => {
    const state = location.state;
    if (state?.activeView) {
      setActiveView(state.activeView);
    }
    if (state?.searchTerm) {
      setSearchTerm(state.searchTerm);
    }
    
    // Restore scroll position after a short delay to ensure content is rendered
    if (state?.scrollPosition !== undefined) {
      setTimeout(() => {
        window.scrollTo(0, state.scrollPosition);
      }, 100);
      
      // Clear the state so it doesn't persist on next navigation
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, location.search]);

  // Memoized filtered lists - only recompute when data or search changes
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!debouncedSearchTerm) return events;
    
    return events.filter(event =>
      event.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.venue?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [events, debouncedSearchTerm]);

  const filteredMakers = useMemo(() => {
    if (!debouncedSearchTerm) return allMusicians;
    
    return allMusicians.filter(maker =>
      maker.display_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.bio?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      maker.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [allMusicians, debouncedSearchTerm]);

  const filteredBands = useMemo(() => {
    if (!debouncedSearchTerm) return bands;
    
    return bands.filter(band =>
      band.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      band.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      band.genre?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [bands, debouncedSearchTerm]);

  const filteredOrganizers = useMemo(() => {
    if (!debouncedSearchTerm) return allOrganizers;
    
    return allOrganizers.filter(organizer =>
      organizer.display_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.bio?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      organizer.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [allOrganizers, debouncedSearchTerm]);

  // Helper to get public URL for images
  const getPublicUrl = useCallback((filePath: string) => {
    if (!filePath) return '';
    const { data } = supabase.storage.from('filbank').getPublicUrl(filePath);
    return data.publicUrl || '';
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleViewEvent = useCallback((eventId: string) => {
    navigate(`/arrangement/${eventId}`);
  }, [navigate]);

  const handleViewProfile = useCallback((userId: string) => {
    // Save current state for back navigation
    const exploreState = {
      fromSection: 'explore',
      activeView,
      searchTerm,
      scrollPosition: window.scrollY || document.documentElement.scrollTop
    };
    
    navigate(`/profile/${userId}`, { 
      state: exploreState
    });
  }, [navigate, activeView, searchTerm]);

  const handleViewBand = useCallback((bandId: string) => {
    navigate(`/band/${bandId}`, { 
      state: { fromSection: 'explore' } 
    });
  }, [navigate]);

  const navItems = [
    { view: 'map' as const, icon: MapPin, title: 'Kart' },
    { view: 'list' as const, icon: Calendar, title: 'Arrangementer' },
    { view: 'makers' as const, icon: User, title: 'Musikere' },
    { view: 'bands' as const, icon: UsersRound, title: 'Band' },
    { view: 'organizers' as const, icon: Building, title: 'Arrangører' },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Navigation Header - Sticky on mobile */}
      <div className="p-3 md:p-4 bg-background/95 backdrop-blur-sm border-b border-border/20 shrink-0 mobile-sticky-header z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Icon Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {navItems.map(({ view, icon: Icon, title }) => (
                <motion.div key={view} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={activeView === view ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveView(view)}
                    className={`shrink-0 w-10 h-10 rounded-full transition-all ${
                      activeView === view 
                        ? 'shadow-md' 
                        : 'hover:bg-muted'
                    }`}
                    title={title}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {/* Search Field */}
            {activeView !== 'map' && (
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Søk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto pb-24 md:pb-4">
        <div className="max-w-2xl mx-auto px-3 py-4 md:px-4">
          
          {/* Events List View */}
          {activeView === 'list' && (
            <ExploreGrid
              loading={eventsLoading}
              emptyIcon={<Calendar className="w-16 h-16" />}
              emptyTitle="Ingen arrangementer tilgjengelig"
              emptyDescription="Kom tilbake senere for å se nye konserter og festivaler"
            >
              {filteredEvents.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <ExploreCard
                    key={event.id}
                    id={event.id}
                    type="event"
                    title={event.title}
                    description={event.description}
                    images={event.banner_url ? [{ url: event.banner_url }] : []}
                    topBadge={{ label: 'Arrangement', color: 'blue' }}
                    badges={event.has_paid_tickets ? [{ label: 'Billetter', color: 'green' }] : []}
                    metaItems={[
                      { icon: 'calendar', text: eventDate.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) },
                      ...(event.venue ? [{ icon: 'location' as const, text: event.venue }] : []),
                    ]}
                    price={event.ticket_price}
                    onClick={() => handleViewEvent(event.id)}
                  />
                );
              })}
            </ExploreGrid>
          )}
                  
          {/* Makers View */}
          {activeView === 'makers' && (
            <ExploreGrid
              loading={musiciansLoading}
              emptyIcon={<User className="w-16 h-16" />}
              emptyTitle={searchTerm ? 'Ingen musikere funnet' : 'Ingen musikere registrert'}
              emptyDescription={searchTerm ? 'Prøv et annet søk' : undefined}
            >
              {filteredMakers.map((maker) => (
                <ExploreCard
                  key={maker.id}
                  id={maker.id}
                  type="musician"
                  title={maker.display_name}
                  subtitle={`@${maker.username}`}
                  description={maker.bio}
                  avatarUrl={maker.avatar_url}
                  topBadge={{ label: 'Musiker', color: 'orange' }}
                  badges={maker.instruments?.slice(0, 2).map(i => ({ label: i.instrument })) || []}
                  metaItems={maker.address ? [{ icon: 'location', text: maker.address }] : []}
                  onClick={() => handleViewProfile(maker.user_id)}
                />
              ))}
            </ExploreGrid>
          )}

          {/* Bands View */}
          {activeView === 'bands' && (
            <ExploreGrid
              loading={bandsLoading}
              emptyIcon={<UsersRound className="w-16 h-16" />}
              emptyTitle={searchTerm ? 'Ingen band funnet' : 'Ingen band ennå'}
            >
              {filteredBands.map((band) => {
                const portfolioFiles = portfoliosByBandId[band.id] || [];
                const imageFiles = portfolioFiles.filter(f => f?.mime_type?.startsWith('image/'));
                const images = [
                  ...(band.banner_url ? [{ url: band.banner_url }] : []),
                  ...imageFiles.map(f => ({ url: getPublicUrl(f.file_path) }))
                ];
                
                return (
                  <ExploreCard
                    key={band.id}
                    id={band.id}
                    type="band"
                    title={band.name}
                    subtitle={band.genre}
                    description={band.description}
                    images={images}
                    avatarUrl={band.image_url}
                    topBadge={{ label: 'Band', color: 'purple' }}
                    badges={band.founded_year ? [{ label: `Dannet ${band.founded_year}` }] : []}
                    metaItems={[
                      { icon: 'users', text: `${band.member_count || 0} medlemmer` }
                    ]}
                    onClick={() => handleViewBand(band.id)}
                  />
                );
              })}
            </ExploreGrid>
          )}

          {/* Organizers View */}
          {activeView === 'organizers' && (
            <ExploreGrid
              loading={organizersLoading}
              emptyIcon={<Building className="w-16 h-16" />}
              emptyTitle={searchTerm ? 'Ingen arrangører funnet' : 'Ingen arrangører registrert'}
              emptyDescription={searchTerm ? 'Prøv et annet søk' : undefined}
            >
              {filteredOrganizers.map((organizer) => (
                <ExploreCard
                  key={organizer.id}
                  id={organizer.id}
                  type="organizer"
                  title={organizer.display_name}
                  subtitle={`@${organizer.username}`}
                  description={organizer.bio}
                  avatarUrl={organizer.avatar_url}
                  topBadge={{ label: 'Arrangør', color: 'green' }}
                  metaItems={organizer.address ? [{ icon: 'location', text: organizer.address }] : []}
                  onClick={() => handleViewProfile(organizer.user_id)}
                />
              ))}
            </ExploreGrid>
          )}
        </div>
      </div>
      
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
