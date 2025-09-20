import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Eye, Search, Music } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ComingSoonMapSection from '@/components/ComingSoonMapSection';
import { ProfileModal } from '@/components/ProfileModal';

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
  const [activeTab, setActiveTab] = useState('map');
  const [makers, setMakers] = useState<any[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isGoer } = useRole();

  // Auto-fetch makers when component mounts
  useEffect(() => {
    fetchAllMakers();
  }, []);

  const fetchAllMakers = async () => {
    try {
      setLoading(true);
      
      // Use new function to get all visible makers
      const { data, error } = await supabase
        .rpc('get_all_visible_makers');
      
      if (error) throw error;
      setMakers(data || []);
      setFilteredMakers(data || []);
    } catch (err) {
      console.error('Error fetching makers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter makers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMakers(makers);
    } else {
      const filtered = makers.filter(maker =>
        maker.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMakers(filtered);
    }
  }, [makers, searchTerm]);

  const handleViewProfile = (makerId: string) => {
    setSelectedUserId(makerId);
    setProfileModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-background ml-16">
      {/* Coming Soon Map */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <ComingSoonMapSection />
      </div>
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex bg-card/95 backdrop-blur-sm rounded-lg p-1 border shadow-lg">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'map'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Kart
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Liste
            </button>
          </div>
          
          {activeTab === 'list' && (
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Søk etter musikere..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card/95 backdrop-blur-sm border shadow-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating List Panel */}
      {activeTab === 'list' && (
        <div className="absolute top-28 left-4 right-4 bottom-4 z-10 animate-fade-in">
          <Card className="h-full bg-card/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Makere i nettverket</h2>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMakers.length}
                  </Badge>
                </div>
              </div>
              
              {/* List Content */}
              <div className="flex-1 overflow-auto" style={{ paddingBottom: '120px' }}>
                {filteredMakers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {loading 
                        ? 'Laster makere...' 
                        : searchTerm 
                          ? 'Ingen makere funnet som matcher søket.'
                          : 'Ingen makere funnet.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {filteredMakers.map((maker) => (
                      <Card key={maker.id} className="group border bg-background/90 hover:border-primary/50 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Music className="w-5 h-5 text-primary" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {maker.display_name}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {maker.role}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {maker.bio || 'Ingen beskrivelse tilgjengelig'}
                                </p>
                                
                                {maker.address && maker.is_address_public && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate">{maker.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <Button 
                                onClick={() => handleViewProfile(maker.user_id)} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Se profil
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
};