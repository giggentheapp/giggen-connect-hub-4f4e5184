import { Card, CardContent } from '@/components/ui/card';
import { SocialMusicLinksManager } from '@/components/SocialMusicLinksManager';
import { Share2 } from 'lucide-react';

interface SocialLinksTabProps {
  socialLinks: {
    instagram: string;
    facebook: string;
    tiktok: string;
    twitter: string;
    website: string;
  };
  onChange: (platform: string, url: string) => void;
}

export const SocialLinksTab = ({ socialLinks, onChange }: SocialLinksTabProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <SocialMusicLinksManager
          title="Sosiale medier"
          platforms={[
            {
              id: 'instagram',
              name: 'Instagram',
              icon: <Share2 className="h-4 w-4" />,
              placeholder: 'https://instagram.com/bandnavn',
            },
            {
              id: 'facebook',
              name: 'Facebook',
              icon: <Share2 className="h-4 w-4" />,
              placeholder: 'https://facebook.com/bandnavn',
            },
            {
              id: 'tiktok',
              name: 'TikTok',
              icon: <Share2 className="h-4 w-4" />,
              placeholder: 'https://tiktok.com/@bandnavn',
            },
            {
              id: 'twitter',
              name: 'Twitter/X',
              icon: <Share2 className="h-4 w-4" />,
              placeholder: 'https://twitter.com/bandnavn',
            },
            {
              id: 'website',
              name: 'Nettside',
              icon: <Share2 className="h-4 w-4" />,
              placeholder: 'https://bandnavn.no',
            },
          ]}
          links={socialLinks}
          onChange={(newLinks) => {
            // Update each platform - set empty string for removed links
            const allPlatforms = ['instagram', 'facebook', 'tiktok', 'twitter', 'website'];
            allPlatforms.forEach(platform => {
              onChange(platform, newLinks[platform] || '');
            });
          }}
        />
      </CardContent>
    </Card>
  );
};
