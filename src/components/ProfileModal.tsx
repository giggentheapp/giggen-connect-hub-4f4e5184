import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, User } from 'lucide-react';
import { useRole } from '@/contexts/RoleProvider';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequest } from '@/components/BookingRequest';
import { WorkingEventsDisplay } from '@/components/WorkingEventsDisplay';
import { ConceptViewModal } from '@/components/ConceptViewModal';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { ProfilePortfolioViewer } from '@/components/ProfilePortfolioViewer';
import { useAppTranslation } from '@/hooks/useAppTranslation';
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
  social_media_links?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    tiktok?: string;
    website?: string;
  };
}
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}
export const ProfileModal = ({
  isOpen,
  onClose,
  userId
}: ProfileModalProps) => {
  const { t } = useAppTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const {
    role: currentUserRole
  } = useRole();
  useEffect(() => {
    if (!userId || !isOpen) {
      setProfile(null);
      setConcepts([]);
      return;
    }
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Get current user ID
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Add debugging
        console.log('Fetching profile for userId:', userId, 'currentUserRole:', currentUserRole);

        // Fetch secure profile data with privacy settings
        const {
          data: profileData,
          error: profileError
        } = await supabase
          .from('profiles')
          .select(`
            id, user_id, display_name, role, avatar_url, created_at,
            bio, address, latitude, longitude, is_address_public,
            contact_info, privacy_settings, social_media_links
          `)
          .eq('user_id', userId)
          .single();
        console.log('Profile RPC result:', {
          profileData,
          profileError
        });
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }
        if (profileData) {
          console.log('Setting profile:', profileData);
          // Type conversion for social_media_links
          const profileWithTypedSocialLinks = {
            ...profileData,
            social_media_links: profileData.social_media_links as ProfileData['social_media_links']
          };
          setProfile(profileWithTypedSocialLinks);
        } else {
          console.warn('No profile data returned for user:', userId);
        }

        // Check portfolio visibility using profile_settings table
        const isOwnProfile = currentUserId === userId;
        
        if (isOwnProfile) {
          setPortfolioVisible(true);
        } else {
          // Check if maker has enabled portfolio sharing in profile_settings
          const { data: profileSettings } = await supabase
            .from('profile_settings')
            .select('show_portfolio')
            .eq('maker_id', userId)
            .single();
          
          const showPortfolio = profileSettings?.show_portfolio === true;
          
          console.log('📁 Portfolio visibility check:', {
            userId,
            profileSettings,
            showPortfolio,
            currentUserRole
          });
          
          setPortfolioVisible(showPortfolio);
        }

        // Fetch concepts if user is maker and viewing another maker
        if (currentUserRole === 'maker') {
          const {
            data: conceptsData
          } = await supabase.from('concepts').select('*').eq('maker_id', userId).eq('is_published', true);
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
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
           <div className="p-6 text-center">
             {loading ? t('loadingProfile') : t('profileNotFound')}
           </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-hidden p-0 gap-0 mobile-modal mobile-optimized">
        <div className="mobile-modal-content">
        {/* Header */}
        <div className="bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" /> : <User className="w-8 h-8 text-primary-foreground" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{profile.role}</Badge>
                  {profile.address && <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.address}
                    </span>}
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
            </div>
          </div>
        </div>

        {/* Content with Sticky Navigation */}
        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="about" className="flex flex-col h-full">
            {/* Fixed Navigation Bar - Always Visible */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b px-6 py-3 shadow-sm">
              <TabsList className={`grid w-full ${currentUserRole === 'maker' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="about">{t('aboutMe')}</TabsTrigger>
                <TabsTrigger value="portfolio">{t('filterPortfolio')}</TabsTrigger>
                {currentUserRole === 'maker' && <TabsTrigger value="concepts">{t('My Offers')}</TabsTrigger>}
                <TabsTrigger value="events">{t('filterEvents')}</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <TabsContent value="about" className="mt-0">
                <Card>
                   <CardHeader>
                     <CardTitle>{t('aboutUser')} {profile.display_name}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     {profile.bio ? <p className="text-muted-foreground">{profile.bio}</p> : <p className="text-muted-foreground italic">{t('noDescriptionAvailable')}</p>}
                    
                    {/* Social Media Links */}
                    {profile.social_media_links && (
                      <div className="mt-6">
                        <SocialMediaLinks socialLinks={profile.social_media_links} />
                      </div>
                    )}
                    
                    {/* SECURITY: Contact info is NEVER shown in profile popups */}
                    {/* Contact info is only available in booking sections when allowed */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-0">
                 <Card>
                   <CardHeader>
                     <CardTitle>{t('filterPortfolio')}</CardTitle>
                   </CardHeader>
                    <CardContent>
                      {!portfolioVisible ? (
                        <p className="text-muted-foreground italic">
                          {t('Portfolio Not Public')}
                        </p>
                      ) : (
                        <ProfilePortfolioViewer 
                          userId={userId} 
                          isOwnProfile={currentUserId === userId}
                        />
                      )}
                    </CardContent>
                 </Card>
              </TabsContent>

              {currentUserRole === 'maker' && <TabsContent value="concepts" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('My Offers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {concepts.length > 0 ? <div className="space-y-4">
                          {concepts.map(concept => <div key={concept.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleConceptClick(concept.id)}>
                              <h4 className="font-medium">{concept.title}</h4>
                              {concept.description && <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>}
                              {concept.price && <p className="text-sm mt-2">Pris: {concept.price} kr</p>}
                              <p className="text-xs text-muted-foreground mt-2">Klikk for å se detaljer</p>
                            </div>)}
                        </div> : <p className="text-muted-foreground italic">{t('noOffersAvailable')}</p>}
                    </CardContent>
                  </Card>
                </TabsContent>}

              <TabsContent value="events" className="mt-0">
                 <Card>
                   <CardHeader>
                     <CardTitle>{t('upcomingEvents')}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     {/* Check privacy settings for events visibility */}
                     {(() => {
                       const isOwnProfile = currentUserId === userId;
                       const privacySettings = (profile as any).privacy_settings || {};
                       const showEvents = isOwnProfile || privacySettings.show_events_to_goers === true;
                       
                       if (!showEvents) {
                         return <p className="text-muted-foreground italic">{t('eventsNotPublic')}</p>;
                       }
                      
                      return (
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
                          showSensitiveInfo={isOwnProfile} 
                          currentUserId={currentUserId}
                          viewerRole={currentUserRole}
                        />
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        </div>
      </DialogContent>

      {/* Concept View Modal */}
      {selectedConceptId && <ConceptViewModal isOpen={isConceptModalOpen} onClose={handleConceptModalClose} conceptIds={[selectedConceptId]} initialConceptIndex={0} showConceptActions={false} />}
    </Dialog>;
};