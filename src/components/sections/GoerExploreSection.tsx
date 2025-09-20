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

export const GoerExploreSection = ({ profile, viewMode = 'list', exploreType = 'makers' }: GoerExploreSectionProps) => {
  const [activeTab, setActiveTab] = useState('list');
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
      {/* Toggle Buttons */}
      <div className="absolute top-6 left-6 z-20">
        <div className="flex bg-white rounded-lg shadow-lg border overflow-hidden">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 ${
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
            className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 ${
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
        <div className="absolute inset-0 flex items-center justify-center p-8">
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
        <div className="absolute inset-0 flex flex-col">
          {/* Search Bar */}
          <div className="p-6 pb-4">
            <div className="max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Søk etter musikere..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full bg-white mx-6 rounded-lg shadow-sm border">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Makere i nettverket</h2>
                  <Badge variant="outline" className="text-xs bg-muted">
                    {filteredMakers.length}
                  </Badge>
                </div>
              </div>
              
              {/* List Items */}
              <div className="flex-1 overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                  <div className="space-y-4">
                    {filteredMakers.map((maker) => (
                      <div key={maker.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
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
                              <span>{maker.address}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <Button
                            onClick={() => handleViewProfile(maker.user_id)}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Se profil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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