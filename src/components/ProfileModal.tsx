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
import { WorkingEventsDisplay } from '@/components/WorkingEventsDisplay';
import { useNavigate } from 'react-router-dom';
import { ConceptViewModal } from '@/components/ConceptViewModal';

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
  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const { role: currentUserRole } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !isOpen) {
      setProfile(null);
      setPortfolio([]);
      setConcepts([]);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Add debugging
        console.log('Fetching profile for userId:', userId, 'currentUserRole:', currentUserRole);
        
        // Fetch secure profile data
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_secure_profile_data', { 
            target_user_id: userId,
            viewer_role: currentUserRole 
          });

        console.log('Profile RPC result:', { profileData, profileError });
        
        if (profileError) {
          console.error('Profile RPC error:', profileError);
          throw profileError;
        }
        
        if (profileData && profileData.length > 0) {
          console.log('Setting profile:', profileData[0]);
          setProfile(profileData[0]);
        } else {
          console.warn('No profile data returned for user:', userId);
        }

        // Fetch portfolio if visible to user
        const isOwnProfile = currentUserId === userId;
        let portfolioData: any[] = [];
        
        if (isOwnProfile) {
          // Own profile - show all portfolio
          const { data, error } = await supabase
            .from('profile_portfolio')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
          portfolioData = data || [];
          setPortfolioVisible(true);
        } else {
          // Other's profile - check if portfolio should be visible
          const { data: settingsData, error: settingsError } = await supabase
            .from('profile_settings')
            .select('show_portfolio')
            .eq('maker_id', userId)
            .maybeSingle();
          
          const showPortfolio = settingsData?.show_portfolio === true;
          setPortfolioVisible(showPortfolio);
          
          if (showPortfolio) {
            const { data, error } = await supabase
              .from('profile_portfolio')
              .select('*')
              .eq('user_id', userId)
              .eq('is_public', true)
              .order('created_at', { ascending: false });
              
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

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, isOpen, currentUserRole]);


  const handleConceptClick = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setIsConceptModalOpen(true);
  };

  const handleConceptModalClose = () => {
    setIsConceptModalOpen(false);
    setSelectedConceptId(null);
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
              {profile.role === 'maker' && currentUserRole === 'maker' && (
                <BookingRequest 
                  receiverId={profile.user_id}
                  receiverName={profile.display_name}
                />
              )}
              {profile.role === 'maker' && currentUserRole === 'goer' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigate(`/profile/${profile.user_id}`);
                    onClose();
                  }}
                >
                  Se full profil
                </Button>
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
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b pb-4 -mt-6 pt-6 mb-4">
              <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">Om meg</TabsTrigger>
              <TabsTrigger value="portfolio">Portefølje</TabsTrigger>
              {currentUserRole === 'maker' && (
                <TabsTrigger value="concepts">Mine tilbud</TabsTrigger>
              )}
              <TabsTrigger value="events">Arrangementer</TabsTrigger>
              </TabsList>
            </div>

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
                  
                  {/* SECURITY: Contact info is NEVER shown in profile popups */}
                  {/* Contact info is only available in booking sections when allowed */}
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
                  ) : portfolioVisible ? (
                    <p className="text-muted-foreground italic">Ingen porteføljeelementer funnet</p>
                  ) : (
                    <p className="text-muted-foreground italic">Portefølje er ikke tilgjengelig</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {currentUserRole === 'maker' && (
              <TabsContent value="concepts" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mine tilbud</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {concepts.length > 0 ? (
                      <div className="space-y-4">
                        {concepts.map((concept) => (
                          <div 
                            key={concept.id} 
                            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleConceptClick(concept.id)}
                          >
                            <h4 className="font-medium">{concept.title}</h4>
                            {concept.description && (
                              <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                            )}
                            {concept.price && (
                              <p className="text-sm mt-2">Pris: {concept.price} kr</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">Klikk for å se detaljer</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Ingen tilbud tilgjengelig</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="events" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kommende arrangementer</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkingEventsDisplay 
                    profile={{
                      id: profile.id,
                      user_id: profile.user_id,
                      display_name: profile.display_name,
                      bio: profile.bio || null,
                      role: profile.role as 'maker' | 'goer',
                      avatar_url: profile.avatar_url || null,
                      address: profile.address || null,
                      latitude: profile.latitude || null,
                      longitude: profile.longitude || null,
                      is_address_public: profile.is_address_public,
                      contact_info: profile.contact_info
                    }}
                    showSensitiveInfo={false}
                    currentUserId={currentUserId}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Concept View Modal */}
      {selectedConceptId && (
        <ConceptViewModal
          isOpen={isConceptModalOpen}
          onClose={handleConceptModalClose}
          conceptIds={[selectedConceptId]}
          initialConceptIndex={0}
          showConceptActions={false}
        />
      )}
    </Dialog>
  );
};