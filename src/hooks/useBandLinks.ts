import { useState, useEffect } from 'react';
import { Band } from '@/types/band';

interface MusicLinks {
  spotify: string;
  youtube: string;
  soundcloud: string;
  appleMusic: string;
  bandcamp: string;
}

interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  website: string;
}

export const useBandLinks = (initialBand?: Band) => {
  const [musicLinks, setMusicLinks] = useState<MusicLinks>({
    spotify: '',
    youtube: '',
    soundcloud: '',
    appleMusic: '',
    bandcamp: '',
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    facebook: '',
    tiktok: '',
    twitter: '',
    website: '',
  });

  useEffect(() => {
    if (initialBand) {
      setMusicLinks({
        spotify: initialBand.music_links?.spotify || '',
        youtube: initialBand.music_links?.youtube || '',
        soundcloud: initialBand.music_links?.soundcloud || '',
        appleMusic: initialBand.music_links?.appleMusic || '',
        bandcamp: initialBand.music_links?.bandcamp || '',
      });

      setSocialLinks({
        instagram: initialBand.social_media_links?.instagram || '',
        facebook: initialBand.social_media_links?.facebook || '',
        tiktok: initialBand.social_media_links?.tiktok || '',
        twitter: initialBand.social_media_links?.twitter || '',
        website: initialBand.social_media_links?.website || '',
      });
    }
  }, [initialBand]);

  const setMusicLink = (platform: keyof MusicLinks, url: string) => {
    setMusicLinks(prev => ({ ...prev, [platform]: url }));
  };

  const setSocialLink = (platform: keyof SocialLinks, url: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: url }));
  };

  const reset = () => {
    setMusicLinks({
      spotify: '',
      youtube: '',
      soundcloud: '',
      appleMusic: '',
      bandcamp: '',
    });
    setSocialLinks({
      instagram: '',
      facebook: '',
      tiktok: '',
      twitter: '',
      website: '',
    });
  };

  return {
    musicLinks,
    socialLinks,
    setMusicLink,
    setSocialLink,
    reset,
  };
};
