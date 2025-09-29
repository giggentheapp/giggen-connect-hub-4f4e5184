import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, MapPin, Music, Eye, Calendar, Image as ImageIcon, 
  ExternalLink, ChevronDown, ChevronUp, MessageSquare, Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleProvider';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  address?: string;
  social_media_links?: any;
}

interface ProfileSettings {
  show_portfolio?: boolean;
  show_about?: boolean;
  show_contact?: boolean;
  show_events?: boolean;
}

interface Concept {
  id: string;
  title: string;
  description: string;
  price: number;
  expected_audience: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
}

interface MobileProfileCardProps {
  userId: string | null;
  onClose: () => void;
}

export const MobileProfileCard = ({ userId, onClose }: MobileProfileCardProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { ismaker } = useRole();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    
    fetchProfileData();
    fetchConcepts();
    fetchEvents();
  }, [userId]);

  const fetchProfileData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, role, avatar_url, bio, address, social_media_links')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('profile_settings')
        .select('show_portfolio, show_about, show_contact, show_events')
        .eq('maker_id', userId)
        .single();

      setProfile(profileData);
      setSettings(settingsData || {});
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcepts = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('id, title, description, price, expected_audience')
        .eq('maker_id', userId)
        .eq('is_published', true);

      if (error) throw error;
      setConcepts(data || []);
    } catch (err) {
      console.error('Error fetching concepts:', err);
    }
  };

  const fetchEvents = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, title, description, event_date, venue')
        .eq('receiver_id', userId)
        .eq('status', 'upcoming')
        .eq('is_public_after_approval', true);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  if (!userId || !profile) return null;

  const showPortfolio = settings?.show_portfolio ?? false;
  const showAbout = settings?.show_about ?? false;
  const showEvents = settings?.show_events ?? false;

  // Determine available tabs
  const tabs = [
    showAbout && 'info',
    concepts.length > 0 && 'concepts',
    showPortfolio && 'portfolio',
    showEvents && 'events'
  ].filter(Boolean);
  
  const availableTabs = tabs.length;
  
  // Set active tab to first available tab if not set
  if (activeTab === '' && tabs.length > 0) {
    setActiveTab(tabs[0] as string);
  }

  return (
    <div className={`fixed inset-0 z-50 transition-transform duration-300 ${
      expanded ? 'translate-y-0' : 'translate-y-[calc(100%-180px)]'
    }`}>
      <div className="h-full bg-background/98 backdrop-blur-sm shadow-2xl flex flex-col">
        {/* Header - Always visible */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-6 h-6 text-primary" />
                )}
              </div>
              
              {/* Name and role */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {profile.display_name}
                </h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {t(profile.role)}
                </Badge>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-9 w-9 p-0"
              >
                {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Location - if available */}
          {profile.address && (
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{profile.address}</span>
            </div>
          )}
        </div>

        {/* Expandable content - Full screen when expanded */}
        {expanded && availableTabs > 0 && (
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full grid rounded-none flex-shrink-0" style={{ gridTemplateColumns: `repeat(${availableTabs}, 1fr)` }}>
                {showAbout && (
                  <TabsTrigger value="info" className="text-xs px-2">
                    <Eye className="w-3 h-3 mr-1" />
                    Om
                  </TabsTrigger>
                )}
                {concepts.length > 0 && (
                  <TabsTrigger value="concepts" className="text-xs px-2">
                    <Package className="w-3 h-3 mr-1" />
                    Tilbud
                  </TabsTrigger>
                )}
                {showPortfolio && (
                  <TabsTrigger value="portfolio" className="text-xs px-2">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Media
                  </TabsTrigger>
                )}
                {showEvents && (
                  <TabsTrigger value="events" className="text-xs px-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    Event
                  </TabsTrigger>
                )}
              </TabsList>

              {showAbout && (
                <TabsContent value="info" className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* Bio */}
                  {profile.bio && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Om meg</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Social media */}
                  {profile.social_media_links && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{t('socialMedia')}</h4>
                      <SocialMediaLinks 
                        socialLinks={profile.social_media_links}
                      />
                    </div>
                  )}
                </TabsContent>
              )}

              {concepts.length > 0 && (
                <TabsContent value="concepts" className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {concepts.map((concept) => (
                    <Card key={concept.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm mb-1">{concept.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {concept.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          {concept.price && (
                            <Badge variant="secondary">
                              {concept.price.toLocaleString('no-NO')} kr
                            </Badge>
                          )}
                          {concept.expected_audience && (
                            <span className="text-muted-foreground">
                              {concept.expected_audience} publikum
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              )}

              {showPortfolio && (
                <TabsContent value="portfolio" className="p-4 flex-1 overflow-y-auto">
                  <ProfilePortfolioViewer 
                    userId={userId}
                    showControls={false}
                    isOwnProfile={false}
                  />
                </TabsContent>
              )}

              {showEvents && (
                <TabsContent value="events" className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Ingen kommende arrangementer
                    </p>
                  ) : (
                    events.map((event) => (
                      <Card key={event.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(event.event_date).toLocaleDateString('no-NO', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </Badge>
                          </div>
                          {event.venue && (
                            <div className="flex items-center text-xs text-muted-foreground mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.venue}
                            </div>
                          )}
                          {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
        
        {/* Show message if no tabs available */}
        {expanded && availableTabs === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-muted-foreground text-center">
              Ingen offentlig informasjon tilgjengelig
            </p>
          </div>
        )}

        {/* Bottom action bar - Always visible */}
        <div className="px-4 py-3 border-t bg-muted/30 flex-shrink-0">
          <div className="flex gap-2">
            {ismaker && (
              <Button
                onClick={() => {
                  navigate(`/booking/create/${userId}`);
                  onClose();
                }}
                className="flex-1 min-h-[48px] touch-target"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('bookNow')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 min-h-[48px] touch-target"
            >
              {t('close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
