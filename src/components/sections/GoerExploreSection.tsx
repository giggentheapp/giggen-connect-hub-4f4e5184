import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Clock, Eye, MessageSquare } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapBackground } from '@/components/MapBackground';
import { ProfileModal } from '@/components/ProfileModal';
import { EventModal } from '@/components/EventModal';
import { BookingRequest } from '@/components/BookingRequest';

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
  const [currentViewMode, setCurrentViewMode] = useState<'map' | 'list'>('map');
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
    navigate(`/profile/${makerId}`);
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* Clean Toggle Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Toggle Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setCurrentViewMode('map')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                currentViewMode === 'map'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Kart
            </button>
            <button
              onClick={() => setCurrentViewMode('list')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                currentViewMode === 'list'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Liste
            </button>
          </div>

          {/* Maker Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600 font-medium">{makers.length} makers</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 pt-20">
        {currentViewMode === 'map' ? (
          /* MAP VIEW */
          <MapBackground 
            onProfileClick={(makerId) => handleViewProfile(makerId)}
            filterType={currentFilter}
          />
        ) : (
          /* LIST VIEW */
          <div className="absolute inset-0 bg-background overflow-auto">
            <div className="container mx-auto px-6 py-6 max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Makere i nettverket
                </h2>
                <Button 
                  onClick={fetchMakers} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Oppdater makere
                </Button>
              </div>
              
              {makers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{loading ? 'Laster makere...' : 'Ingen makere funnet.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {makers.map((maker) => (
                    <div key={maker.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {maker.display_name}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                            {maker.bio || 'Ingen beskrivelse tilgjengelig'}
                          </p>
                          <div className="flex items-center gap-4">
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-50 text-blue-600 border-blue-200 text-xs font-medium"
                            >
                              maker
                            </Badge>
                            {maker.address && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {maker.address}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(maker.user_id);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Se profil
                          </Button>
                          <BookingRequest
                            receiverId={maker.user_id}
                            receiverName={maker.display_name}
                            onSuccess={() => {
                              // Handle success if needed
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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