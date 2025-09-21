import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';

interface SocialMediaSettingsProps {
  userRole?: string;
  userId?: string;
}

export const SocialMediaSettings = ({ userRole, userId }: SocialMediaSettingsProps) => {
  const { t } = useAppTranslation();
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    spotify: '',
    soundcloud: '',
    tiktok: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);

  // Only show for Makers
  if (userRole !== 'maker') {
    return null;
  }

  const socialPlatforms = [
    { key: 'instagram', label: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/yourpage' },
    { key: 'youtube', label: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/yourchannel' },
    { key: 'spotify', label: 'Spotify', icon: '🎵', placeholder: 'https://open.spotify.com/artist/...' },
    { key: 'soundcloud', label: 'SoundCloud', icon: '🔊', placeholder: 'https://soundcloud.com/yourprofile' },
    { key: 'tiktok', label: 'TikTok', icon: '🎬', placeholder: 'https://tiktok.com/@yourhandle' },
    { key: 'website', label: 'Website', icon: '🌐', placeholder: 'https://yourwebsite.com' }
  ];

  const handleInputChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const saveSocialLinks = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ social_media_links: socialLinks })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Sosiale medier linker lagret!');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Kunne ikke lagre linker. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const loadSocialLinks = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('social_media_links')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (data?.social_media_links && typeof data.social_media_links === 'object') {
        const links = data.social_media_links as Record<string, string>;
        setSocialLinks({
          instagram: links.instagram || '',
          facebook: links.facebook || '',
          youtube: links.youtube || '',
          spotify: links.spotify || '',
          soundcloud: links.soundcloud || '',
          tiktok: links.tiktok || '',
          website: links.website || ''
        });
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadSocialLinks();
    }
  }, [userId]);

  return (
    <Card className="border-2 hover:border-primary/50 transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          Sosiale medier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Legg til dine sosiale medier profiler som vil vises på profilen din
        </p>
        
        <div className="space-y-4">
          {socialPlatforms.map(platform => (
            <div key={platform.key} className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-lg">{platform.icon}</span>
                {platform.label}
              </Label>
              <Input
                type="url"
                placeholder={platform.placeholder}
                value={socialLinks[platform.key as keyof typeof socialLinks]}
                onChange={(e) => handleInputChange(platform.key, e.target.value)}
                className="bg-background/50"
              />
            </div>
          ))}
        </div>
        
        <Button 
          onClick={saveSocialLinks} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Lagrer...' : 'Lagre sosiale medier'}
        </Button>
      </CardContent>
    </Card>
  );
};