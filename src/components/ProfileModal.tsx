import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, User, X } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { EventModal } from '@/components/EventModal';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  bio?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_address_public: boolean;
  contact_info?: any;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export const ProfileModal = ({ isOpen, onClose, userId }: ProfileModalProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { role: currentUserRole } = useRole();

  useEffect(() => {
    if (!userId || !isOpen) {
      setProfile(null);
      setPortfolio([]);
      setConcepts([]);
      setEvents([]);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Fetch secure profile data
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_secure_profile_data', { 
            target_user_id: userId,
            viewer_role: currentUserRole 
          });

        if (profileError) throw profileError;
        if (profileData && profileData.length > 0) {
          setProfile(profileData[0]);
        }

        // Fetch portfolio if visible to user
        const { data: { user } } = await supabase.auth.getUser();
        const isOwnProfile = user?.id === userId;
        let portfolioData: any[] = [];
        
        if (isOwnProfile) {
          // Own profile - show all portfolio
          const { data } = await supabase
            .from('profile_portfolio')
            .select('*')
            .eq('user_id', userId);
          portfolioData = data || [];
          setPortfolioVisible(true);
        } else {
          // Other's profile - check if portfolio should be visible
          const { data: settingsData } = await supabase
            .from('profile_settings')
            .select('show_portfolio')
            .eq('maker_id', userId)
            .maybeSingle();
            
          const showPortfolio = settingsData?.show_portfolio || false;
          setPortfolioVisible(showPortfolio);
          
          if (showPortfolio) {
            const { data } = await supabase
              .from('profile_portfolio')
              .select('*')
              .eq('user_id', userId)
              .eq('is_public', true);
            portfolioData = data || [];
          }
        }
        
        setPortfolio(portfolioData);

        // Fetch concepts if user is maker and viewing another maker
        if (currentUserRole === 'maker') {
          const { data: conceptsData } = await supabase
            .from('concepts')
            .select('*')
            .eq('maker_id', userId)
            .eq('is_published', true);

          setConcepts(conceptsData || []);
        }

        // Fetch public events
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('maker_id', userId)
          .eq('is_public', true);

        setEvents(eventsData || []);

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, isOpen, currentUserRole]);

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsEventModalOpen(true);
  };

  const handleEventModalClose = () => {
    setIsEventModalOpen(false);
    setSelectedEventId(null);
  };

  if (!profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 text-center">
            {loading ? 'Laster profil...' : 'Profil ikke funnet'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderFilePreview = (file: any) => {
    if (file.mime_type?.startsWith('image/')) {
      return (
        <img 
          src={file.file_url} 
          alt={file.title || file.filename}
          className="w-full h-48 object-cover rounded-lg"
        />
      );
    } else if (file.mime_type?.startsWith('video/')) {
      return (
        <video 
          src={file.file_url} 
          controls 
          className="w-full h-48 rounded-lg"
        />
      );
    } else if (file.mime_type?.startsWith('audio/')) {
      return (
        <audio 
          src={file.file_url} 
          controls 
          className="w-full"
        />
      );
    }
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <span className="text-sm text-muted-foreground">{file.filename}</span>
      </div>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{profile.role}</Badge>
                  {profile.address && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile.role === 'maker' && (
                <BookingRequest 
                  receiverId={profile.user_id}
                  receiverName={profile.display_name}
                />
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">Om meg</TabsTrigger>
              <TabsTrigger value="portfolio">Portefølje</TabsTrigger>
              {currentUserRole === 'maker' ? (
                <TabsTrigger value="concepts">Konsepter</TabsTrigger>
              ) : (
                <TabsTrigger value="events">Kommende arrangementer</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Om {profile.display_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.bio ? (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Ingen beskrivelse tilgjengelig</p>
                  )}
                  
                  {profile.contact_info && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Kontaktinformasjon</h4>
                      {profile.contact_info.email && (
                        <p className="text-sm">Email: {profile.contact_info.email}</p>
                      )}
                      {profile.contact_info.phone && (
                        <p className="text-sm">Telefon: {profile.contact_info.phone}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portefølje</CardTitle>
                </CardHeader>
                <CardContent>
                  {!portfolioVisible ? (
                    <p className="text-muted-foreground italic">
                      Portefølje er ikke offentlig tilgjengelig
                    </p>
                  ) : portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {portfolio.map((file) => (
                        <div key={file.id} className="space-y-2">
                          {renderFilePreview(file)}
                          {file.title && (
                            <h4 className="font-medium">{file.title}</h4>
                          )}
                          {file.description && (
                            <p className="text-sm text-muted-foreground">{file.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Ingen porteføljeelementer tilgjengelig</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {currentUserRole === 'maker' ? (
              <TabsContent value="concepts" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Konsepter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {concepts.length > 0 ? (
                      <div className="space-y-4">
                        {concepts.map((concept) => (
                          <div key={concept.id} className="p-4 border rounded-lg">
                            <h4 className="font-medium">{concept.title}</h4>
                            {concept.description && (
                              <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                            )}
                            {concept.price && (
                              <p className="text-sm mt-2">Pris: {concept.price} kr</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Ingen konsepter tilgjengelig</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : (
              <TabsContent value="events" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kommende arrangementer</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {events.length > 0 ? (
                       <div className="space-y-4">
                         {events.map((event) => (
                           <div 
                             key={event.id} 
                             className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                             onClick={() => handleEventClick(event.id)}
                           >
                             <h4 className="font-medium">{event.title}</h4>
                             {event.description && (
                               <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                             )}
                             {event.event_date && (
                               <p className="text-sm mt-2">
                                 Dato: {new Date(event.event_date).toLocaleDateString('nb-NO')}
                               </p>
                             )}
                             {event.location && (
                               <p className="text-sm">Sted: {event.location}</p>
                             )}
                             <p className="text-xs text-muted-foreground mt-2">Klikk for å se detaljer</p>
                           </div>
                         ))}
                       </div>
                    ) : (
                      <p className="text-muted-foreground italic">Ingen kommende arrangementer</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
      
      <EventModal 
        isOpen={isEventModalOpen}
        onClose={handleEventModalClose}
        eventId={selectedEventId}
      />
    </Dialog>
  );
};