import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Eye, Search, Music, Grid, List } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ComingSoonMapSection from '@/components/ComingSoonMapSection';
import { ProfileModal } from '@/components/ProfileModal';
import { MakerCard } from '@/components/MakerCard';
import { SearchFilters } from '@/components/SearchFilters';

interface FilterOptions {
  location: string;
  hasPortfolio: boolean;
  hasEvents: boolean;
  isVerified: boolean;
}

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
  const [activeTab, setActiveTab] = useState('list');
  const [listViewMode, setListViewMode] = useState<'grid' | 'list'>('grid');
  const [makers, setMakers] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    hasPortfolio: false,
    hasEvents: false,
    isVerified: false,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isGoer, ismaker } = useRole();

  // Auto-fetch makers when component mounts
  useEffect(() => {
    fetchAllMakers();
  }, []);

  const fetchAllMakers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching makers with privacy-based filtering...');
      
      // Get current user for role checking
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Du må være logget inn for å se makere.');
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
        .eq('role', 'maker')
        .eq('privacy_settings->>show_profile_to_goers', 'true')
        .order('created_at', { ascending: false });
      
      if (profileError) {
        console.error('❌ Failed to fetch makers:', profileError);
        setError('Kunne ikke laste musikere. Prøv igjen senere.');
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
      setError(err.message || 'Noe gikk galt ved lasting av musikere');
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

  const handleViewProfile = (makerId: string) => {
    setSelectedUserId(makerId);
    setProfileModalOpen(true);
  };

  const handleBookMaker = (makerId: string) => {
    // Navigate to booking flow - this could be enhanced
    navigate(`/booking/new?maker=${makerId}`);
  };

  return (
    <div className="w-full h-full bg-background">
      {/* Toggle Buttons */}
      <div className="flex items-center justify-center p-4 border-b border-border/10">
        <div className="flex bg-white rounded-lg shadow-sm border overflow-hidden">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'map'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Kart
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Liste
          </button>
        </div>
      </div>

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-8">
              Interaktivt kart kommer snart
            </h1>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Geografisk oversikt over musikere i Norge</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Avstandsbasert søk og filtrering</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Visuell oversikt over lokal musikkscene</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Enkel identifisering av musikere i ditt område</p>
              </div>
            </div>
            
            <div className="mt-8">
              <span className="text-primary font-medium">Under utvikling</span>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filters */}
          <div className="p-4 bg-background border-b border-border/10 shrink-0">
            <SearchFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredMakers.length}
              loading={loading}
            />
          </div>

          {/* List Header with View Toggle */}
          <div className="px-4 py-3 bg-background border-b border-border/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Makere i nettverket</h2>
                <Badge variant="outline" className="text-xs bg-muted">
                  {loading ? '...' : filteredMakers.length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={listViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListViewMode('grid')}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={listViewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListViewMode('list')}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Laster makere...</p>
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
                    Prøv igjen
                  </Button>
                </div>
              </div>
            ) : filteredMakers.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center max-w-md space-y-2">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">
                    {searchTerm || Object.values(filters).some(Boolean)
                      ? 'Ingen makere funnet som matcher kriteriene.'
                      : 'Ingen makere funnet.'
                    }
                  </p>
                  {(searchTerm || Object.values(filters).some(Boolean)) && (
                    <p className="text-sm">
                      Prøv å justere søket eller filtrene for å se flere resultater.
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
                      onBookMaker={ismaker ? handleBookMaker : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUserId}
      />
    </div>
  );
};