import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Eye, Search, Music, Grid, List, Calendar } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MakerCard } from '@/components/MakerCard';
import { SearchFilters } from '@/components/SearchFilters';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { ProfileEventCard } from '@/components/ProfileEventCard';

interface FilterOptions {
  location: string;
  hasPortfolio: boolean;
  hasEvents: boolean;
  isVerified: boolean;
}

import { UserProfile } from '@/types/auth';

interface AudienceExploreSectionProps {
  profile: UserProfile;
  viewMode?: 'map' | 'list';
  exploreType?: 'makers' | 'events';
}

export const AudienceExploreSection = ({ profile, viewMode = 'list', exploreType = 'makers' }: AudienceExploreSectionProps) => {
  const [listViewMode, setListViewMode] = useState<'grid' | 'list'>('grid');
  const [makers, setMakers] = useState<any[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    hasPortfolio: false,
    hasEvents: false,
    isVerified: false,
  });
  const [activeTab, setActiveTab] = useState<'makers' | 'events'>('events');
  const navigate = useNavigate();
  const { isAudience, isArtist } = useRole();
  const { t } = useAppTranslation();

  // Auto-fetch data when component mounts
  useEffect(() => {
    fetchAllMakers();
    fetchPublishedEvents();
  }, []);

  const fetchPublishedEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching published events from events_market...');
      
      // Fetch published events from events_market
      const { data: eventsData, error: eventsError } = await supabase
        .from('events_market')
        .select(`
          id,
          title,
          description,
          venue,
          date,
          time,
          ticket_price,
          expected_audience,
          created_by,
          is_public
        `)
        .eq('is_public', true)
        .order('date', { ascending: true });
      
      if (eventsError) {
        console.error('❌ Failed to fetch events:', eventsError);
        setError('Kunne ikke laste arrangementer');
        setPublishedEvents([]);
        setFilteredEvents([]);
        return;
      }
      
      console.log('✅ Successfully fetched published events:', eventsData?.length || 0);
      
      setPublishedEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
      
    } catch (err: any) {
      console.error('❌ Error fetching events:', err);
      setError(err.message || 'Noe gikk galt');
      setPublishedEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMakers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching makers with privacy-based filtering...');
      
      // Get current user for role checking
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('loginRequired'));
        return;
      }

      // Fetch makers with privacy settings - only those who allow Goer visibility
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          bio,
          role,
          avatar_url,
          address,
          latitude,
          longitude,
          is_address_public,
          privacy_settings,
          created_at
        `)
        .eq('role', 'artist')
        .eq('privacy_settings->>show_profile_to_goers', 'true')
        .order('created_at', { ascending: false });
      
      if (profileError) {
        console.error('❌ Failed to fetch makers:', profileError);
        setError(t('couldNotLoadMusicians'));
        setMakers([]);
        setFilteredMakers([]);
        return;
      }
      
      console.log('✅ Successfully fetched makers:', profileData?.length || 0);
      
      // Filter out sensitive data based on privacy settings
      const safeProfileData = (profileData || []).map(maker => {
        const privacySettings = (maker.privacy_settings as any) || {};
        
        return {
          id: maker.id,
          user_id: maker.user_id,
          display_name: maker.display_name,
          // Only show bio if allowed in privacy settings
          bio: privacySettings.show_profile_to_goers ? maker.bio : null,
          role: maker.role,
          avatar_url: maker.avatar_url,
          // Only include location if explicitly public AND privacy allows it
          address: (maker.is_address_public && privacySettings.show_profile_to_goers) ? maker.address : null,
          latitude: (maker.is_address_public && privacySettings.show_profile_to_goers) ? maker.latitude : null,
          longitude: (maker.is_address_public && privacySettings.show_profile_to_goers) ? maker.longitude : null,
          is_address_public: maker.is_address_public,
          privacy_settings: privacySettings,
          created_at: maker.created_at
        };
      });
      
      setMakers(safeProfileData);
      setFilteredMakers(safeProfileData);
      
    } catch (err: any) {
      console.error('❌ Error fetching makers:', err);
      setError(err.message || t('somethingWentWrong'));
      setMakers([]);
      setFilteredMakers([]);
    } finally {
      setLoading(false);
    }
  };

  // Advanced filtering with useMemo for performance
  const filteredAndSearchedMakers = useMemo(() => {
    let result = makers;

    // Apply search term
    if (searchTerm) {
      result = result.filter(maker =>
        maker.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.location) {
      result = result.filter(maker => 
        maker.address?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.hasPortfolio) {
      result = result.filter(maker => 
        maker.privacy_settings?.show_portfolio_to_goers === true
      );
    }

    if (filters.hasEvents) {
      result = result.filter(maker => 
        maker.privacy_settings?.show_events_to_goers === true
      );
    }

    if (filters.isVerified) {
      // For now, all makers are considered "verified" - this could be enhanced
      result = result;
    }

    return result;
  }, [makers, searchTerm, filters]);

  // Update filtered makers when filters change
  useEffect(() => {
    setFilteredMakers(filteredAndSearchedMakers);
  }, [filteredAndSearchedMakers]);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleBookMaker = (makerId: string) => {
    // Navigate to booking flow - this could be enhanced
    navigate(`/booking/new?maker=${makerId}`);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* List View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Tabs for Events vs Makers */}
        <div className="px-3 md:px-4 pt-2 bg-background shrink-0 mobile-sticky-header">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'makers' | 'events')}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="events" className="text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Kommende Arrangementer
                </TabsTrigger>
                <TabsTrigger value="makers" className="text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  {t('Artists and organizers')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Search and Filters - Only show for makers tab */}
        {activeTab === 'makers' && (
          <div className="p-2 md:p-3 bg-background border-b border-border/10 shrink-0 mobile-sticky-header" style={{ top: '48px' }}>
            <div className="max-w-4xl mx-auto">
              <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={filteredMakers.length}
                loading={loading}
                onMapClick={() => navigate('/map')}
              />
            </div>
          </div>
        )}

        {/* List Header with View Toggle */}
        <div className="px-3 md:px-4 py-2 bg-background border-b border-border/10 shrink-0 mobile-sticky-header" style={{ top: '48px' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base md:text-lg font-semibold text-foreground">
                  {activeTab === 'events' ? 'Publiserte Arrangementer' : t('makersInNetwork')}
                </h2>
                <Badge variant="outline" className="text-xs bg-muted">
                  {loading ? '...' : activeTab === 'events' ? filteredEvents.length : filteredMakers.length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={listViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListViewMode('grid')}
                  className="px-2 md:px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={listViewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListViewMode('list')}
                  className="px-2 md:px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-4 min-h-0">
          <div className="max-w-4xl mx-auto">
          {activeTab === 'events' ? (
            // Published Events View
            loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Laster arrangementer...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">{error}</p>
                  <Button 
                    onClick={fetchPublishedEvents} 
                    variant="outline" 
                    size="sm"
                    className="text-primary border-primary/20 hover:bg-primary hover:text-white"
                  >
                    Prøv igjen
                  </Button>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center max-w-md space-y-2">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Ingen publiserte arrangementer</p>
                  <p className="text-sm">Kommende arrangementer vil vises her</p>
                </div>
              </div>
            ) : (
              <div className={`${
                listViewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
                  : 'space-y-3'
              } animate-fade-in`}>
                {filteredEvents.map((event) => (
                  <ProfileEventCard 
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      description: event.description,
                      event_date: event.date,
                      time: event.time,
                      ticket_price: event.ticket_price,
                      price_musician: undefined
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            // Makers View
            loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>{t('Loading Makers')}</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <div className="text-center">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">{error}</p>
                  <Button 
                    onClick={fetchAllMakers} 
                    variant="outline" 
                    size="sm"
                    className="text-primary border-primary/20 hover:bg-primary hover:text-white"
                  >
                    {t('tryAgain')}
                  </Button>
                </div>
              </div>
            ) : filteredMakers.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center max-w-md space-y-2">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">
                    {searchTerm || Object.values(filters).some(Boolean)
                      ? t('No Makers Found Filtered')
                      : t('No Makers Found')
                    }
                  </p>
                  {(searchTerm || Object.values(filters).some(Boolean)) && (
                    <p className="text-sm">
                      {t('Adjust Filters')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${
                listViewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
                  : 'space-y-3'
              } animate-fade-in`}>
                {filteredMakers.map((maker) => (
                  <div 
                    key={maker.id} 
                    className="animate-fade-in"
                  >
                    <MakerCard
                      maker={maker}
                      onViewProfile={handleViewProfile}
                      onBookMaker={isArtist ? handleBookMaker : undefined}
                    />
                  </div>
                ))}
              </div>
            )
          )}
          </div>
        </div>
      </div>
    </div>
  );
};