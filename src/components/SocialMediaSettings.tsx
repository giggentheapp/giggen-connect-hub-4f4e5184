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
    { 
      key: 'instagram', 
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      placeholder: 'https://instagram.com/yourhandle' 
    },
    { 
      key: 'facebook', 
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      placeholder: 'https://facebook.com/yourpage' 
    },
    { 
      key: 'youtube', 
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      placeholder: 'https://youtube.com/yourchannel' 
    },
    { 
      key: 'spotify', 
      label: 'Spotify',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      ),
      placeholder: 'https://open.spotify.com/artist/...' 
    },
    { 
      key: 'soundcloud', 
      label: 'SoundCloud',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.104.101.104.05 0 .093-.046.101-.104l.255-2.105-.255-2.154c-.008-.054-.05-.1-.101-.1zm1.33.075c-.058 0-.106.053-.113.12L2.04 14.479l.35 2.047c.007.067.055.12.113.12.057 0 .105-.053.112-.12L3.025 14.479l-.41-2.059c-.007-.067-.055-.12-.112-.12zm1.286.107c-.064 0-.116.058-.123.13l-.296 1.877.296 2.013c.007.072.059.131.123.131.063 0 .116-.059.123-.131l.32-2.013-.32-1.877c-.007-.072-.06-.13-.123-.13zm1.27.15c-.069 0-.125.062-.132.139l-.265 1.698.265 1.989c.007.077.063.139.132.139.068 0 .124-.062.131-.139L5.458 14.757l-.265-1.698c-.007-.077-.063-.139-.131-.139zm1.247.2c-.074 0-.134.066-.141.148l-.234 1.548.234 1.967c.007.082.067.148.141.148.073 0 .133-.066.14-.148L6.457 14.757l-.234-1.548c-.007-.082-.067-.148-.14-.148zm1.24.26c-.079 0-.143.071-.15.159l-.204 1.289.204 1.947c.007.088.071.159.15.159.078 0 .142-.071.149-.159L7.697 14.757l-.204-1.289c-.007-.088-.071-.159-.149-.159zm1.225.31c-.083 0-.15.075-.157.169l-.175 1.038.175 1.927c.007.094.074.169.157.169.082 0 .149-.075.156-.169L8.922 14.757l-.175-1.038c-.007-.094-.074-.169-.156-.169zm9.761-2.094c-.837 0-1.516.679-1.516 1.516 0 .837.679 1.516 1.516 1.516.836 0 1.515-.679 1.515-1.516 0-.837-.679-1.516-1.515-1.516zm-1.616 2.68c-.088 0-.159.08-.166.179l-.155.959.155 1.906c.007.099.078.179.166.179.087 0 .158-.08.165-.179L16.8 14.757l-.155-.959c-.007-.099-.078-.179-.165-.179zm-1.203-.395c-.093 0-.168.084-.175.188l-.135.766.135 1.88c.007.104.082.188.175.188.092 0 .167-.084.174-.188L15.597 14.757l-.135-.766c-.007-.104-.082-.188-.174-.188zm-1.184-.419c-.097 0-.175.088-.182.197l-.115.588.115 1.854c.007.109.085.197.182.197.096 0 .174-.088.181-.197L14.413 14.757l-.115-.588c-.007-.109-.085-.197-.181-.197zm-1.166-.435c-.101 0-.182.092-.189.207l-.095.416.095 1.828c.007.115.088.207.189.207.1 0 .181-.092.188-.207L13.229 14.757l-.095-.416c-.007-.115-.088-.207-.188-.207zm-1.149-.451c-.105 0-.189.096-.196.217l-.075.25.075 1.802c.007.121.091.217.196.217.104 0 .188-.096.195-.217L12.08 14.757l-.075-.25c-.007-.121-.091-.217-.195-.217zm-1.131-.467c-.109 0-.196.1-.203.227l-.055.09.055 1.776c.007.127.094.227.203.227.108 0 .195-.1.202-.227L10.931 14.757l-.055-.09c-.007-.127-.094-.227-.202-.227z"/>
        </svg>
      ),
      placeholder: 'https://soundcloud.com/yourprofile' 
    },
    { 
      key: 'tiktok', 
      label: 'TikTok',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      placeholder: 'https://tiktok.com/@yourhandle' 
    },
    { 
      key: 'website', 
      label: 'Website',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path fill="currentColor" d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12S0 18.623 0 12 5.377 0 12 0zm0 2.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S17.302 2.4 12 2.4zm6.617 2.995a7.26 7.26 0 0 1 1.564 4.486c-.298-.05-.654-.091-1.051-.122-.12-1.518-.44-2.953-.923-4.187.133-.067.273-.128.41-.177zm-13.234 0c.137.049.277.11.41.177-.482 1.234-.804 2.669-.923 4.187-.397.031-.753.072-1.051.122A7.26 7.26 0 0 1 5.383 5.395zM12 4.8c.508 0 1.021.457 1.449 1.342.35.725.627 1.592.818 2.577a25.778 25.778 0 0 0-4.534 0c.191-.985.468-1.852.818-2.577C10.979 5.257 11.492 4.8 12 4.8zm-2.386.901c-.315.709-.563 1.507-.736 2.384a23.9 23.9 0 0 0-3.299.397c.465-1.089 1.180-2.063 2.101-2.876.625.03 1.25.063 1.934.095zm4.772 0c.684-.032 1.309-.065 1.934-.095.921.813 1.636 1.787 2.101 2.876a23.9 23.9 0 0 0-3.299-.397c-.173-.877-.421-1.675-.736-2.384zM12 9.6c.86 0 1.555 1.075 1.555 2.4S12.86 14.4 12 14.4 10.445 13.325 10.445 12 11.14 9.6 12 9.6z"/>
        </svg>
      ),
      placeholder: 'https://yourwebsite.com' 
    }
  ];

  const handleInputChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string.startsWith('http') ? string : 'https://' + string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const saveSocialLinks = async () => {
    if (!userId) return;
    
    // Validate all URLs before saving
    const validatedLinks: Record<string, string> = {};
    for (const [key, value] of Object.entries(socialLinks)) {
      if (value.trim() && !isValidUrl(value.trim())) {
        toast.error(`Ugyldig URL for ${key}: ${value}`);
        return;
      }
      validatedLinks[key] = value.trim();
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ social_media_links: validatedLinks })
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
              <Label className="flex items-center gap-2 text-primary">
                {platform.icon}
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