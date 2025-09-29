import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, MapPin, Music, Eye, Calendar, Image as ImageIcon, 
  ExternalLink, ChevronDown, ChevronUp, MessageSquare
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
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    
    fetchProfileData();
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

  if (!userId || !profile) return null;

  const showPortfolio = settings?.show_portfolio;
  const showAbout = settings?.show_about;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-in-bottom">
      <div className="bg-background/95 backdrop-blur-sm border-t shadow-2xl">
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

        {/* Expandable content */}
        {expanded && (
          <div className="max-h-[60vh] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none">
                <TabsTrigger value="info" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  {t('info')}
                </TabsTrigger>
                {showPortfolio && (
                  <TabsTrigger value="portfolio" className="text-xs">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {t('portfolio')}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="info" className="p-4 space-y-4">
                {/* Bio */}
                {showAbout && profile.bio && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t('about')}</h4>
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

              {showPortfolio && (
                <TabsContent value="portfolio" className="p-4">
                  <ProfilePortfolioViewer 
                    userId={userId}
                    showControls={false}
                    isOwnProfile={false}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* Bottom action bar */}
        <div className="px-4 py-3 border-t bg-muted/30">
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
