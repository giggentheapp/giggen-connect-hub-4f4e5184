import { Card, CardContent } from '@/components/ui/card';
import { SocialMusicLinksManager } from '@/components/SocialMusicLinksManager';
import { Disc } from 'lucide-react';

interface MusicLinksTabProps {
  musicLinks: {
    spotify: string;
    youtube: string;
    soundcloud: string;
    appleMusic: string;
    bandcamp: string;
  };
  onChange: (platform: string, url: string) => void;
}

export const MusicLinksTab = ({ musicLinks, onChange }: MusicLinksTabProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <SocialMusicLinksManager
          title="Musikklenker"
          platforms={[
            {
              id: 'spotify',
              name: 'Spotify',
              icon: <Disc className="h-4 w-4" />,
              placeholder: 'https://spotify.com/artist/...',
            },
            {
              id: 'youtube',
              name: 'YouTube',
              icon: <Disc className="h-4 w-4" />,
              placeholder: 'https://youtube.com/@bandnavn',
            },
            {
              id: 'soundcloud',
              name: 'SoundCloud',
              icon: <Disc className="h-4 w-4" />,
              placeholder: 'https://soundcloud.com/bandnavn',
            },
            {
              id: 'appleMusic',
              name: 'Apple Music',
              icon: <Disc className="h-4 w-4" />,
              placeholder: 'https://music.apple.com/...',
            },
            {
              id: 'bandcamp',
              name: 'Bandcamp',
              icon: <Disc className="h-4 w-4" />,
              placeholder: 'https://bandnavn.bandcamp.com',
            },
          ]}
          links={musicLinks}
          onChange={(newLinks) => {
            // Update each platform - set empty string for removed links
            const allPlatforms = ['spotify', 'youtube', 'soundcloud', 'appleMusic', 'bandcamp'];
            allPlatforms.forEach(platform => {
              onChange(platform, newLinks[platform] || '');
            });
          }}
        />
      </CardContent>
    </Card>
  );
};
