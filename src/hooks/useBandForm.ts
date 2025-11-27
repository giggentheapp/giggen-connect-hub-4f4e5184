import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  genre: string;
  description: string;
  bio: string;
  foundedYear: string;
}

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

interface ContactInfo {
  email: string;
  phone: string;
  bookingEmail: string;
}

interface BandImages {
  logo: string | null;
  banner: string | null;
}

export const useBandForm = (initialBand?: Band) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    genre: '',
    description: '',
    bio: '',
    foundedYear: '',
  });

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

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    bookingEmail: '',
  });

  const [discography, setDiscography] = useState<string[]>([]);
  const [images, setImages] = useState<BandImages>({ logo: null, banner: null });

  useEffect(() => {
    if (initialBand) {
      setFormData({
        name: initialBand.name || '',
        genre: initialBand.genre || '',
        description: initialBand.description || '',
        bio: initialBand.bio || '',
        foundedYear: initialBand.founded_year?.toString() || '',
      });

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

      setContactInfo({
        email: initialBand.contact_info?.email || '',
        phone: initialBand.contact_info?.phone || '',
        bookingEmail: initialBand.contact_info?.booking_email || '',
      });

      setDiscography(initialBand.discography || []);
      setImages({ logo: initialBand.image_url, banner: initialBand.banner_url });
    }
  }, [initialBand]);

  const setFormField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setMusicLink = (platform: keyof MusicLinks, url: string) => {
    setMusicLinks(prev => ({ ...prev, [platform]: url }));
  };

  const setSocialLink = (platform: keyof SocialLinks, url: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: url }));
  };

  const setContactField = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const addToDiscography = (song: string) => {
    if (song.trim()) {
      setDiscography(prev => [...prev, song.trim()]);
    }
  };

  const removeFromDiscography = (index: number) => {
    setDiscography(prev => prev.filter((_, i) => i !== index));
  };

  const setLogo = (url: string | null) => {
    setImages(prev => ({ ...prev, logo: url }));
  };

  const setBanner = (url: string | null) => {
    setImages(prev => ({ ...prev, banner: url }));
  };

  const handleSubmit = async (
    userId: string,
    bandId?: string,
    isCreate?: boolean,
    selectedLogoFileId?: string | null,
    selectedBannerFileId?: string | null
  ): Promise<Band | null> => {
    if (!formData.name.trim()) {
      toast({
        title: 'Mangler bandnavn',
        description: 'Vennligst fyll inn et bandnavn',
        variant: 'destructive',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const bandData = {
        name: formData.name.trim(),
        genre: formData.genre.trim() || null,
        description: formData.description.trim() || null,
        bio: formData.bio.trim() || null,
        founded_year: formData.foundedYear ? parseInt(formData.foundedYear) : null,
        image_url: images.logo,
        banner_url: images.banner,
        music_links: {
          spotify: musicLinks.spotify.trim() || undefined,
          youtube: musicLinks.youtube.trim() || undefined,
          soundcloud: musicLinks.soundcloud.trim() || undefined,
          appleMusic: musicLinks.appleMusic.trim() || undefined,
          bandcamp: musicLinks.bandcamp.trim() || undefined,
        },
        social_media_links: {
          instagram: socialLinks.instagram.trim() || undefined,
          facebook: socialLinks.facebook.trim() || undefined,
          tiktok: socialLinks.tiktok.trim() || undefined,
          twitter: socialLinks.twitter.trim() || undefined,
          website: socialLinks.website.trim() || undefined,
        },
        contact_info: {
          email: contactInfo.email.trim() || undefined,
          phone: contactInfo.phone.trim() || undefined,
          booking_email: contactInfo.bookingEmail.trim() || undefined,
        },
        discography: discography.length > 0 ? discography : null,
      };

      if (isCreate) {
        console.log('[useBandForm] Creating band with userId:', userId);
        console.log('[useBandForm] Band data:', { ...bandData, is_public: false, created_by: userId });
        
        const { data: newBand, error } = await supabase
          .from('bands')
          .insert({ ...bandData, is_public: false, created_by: userId })
          .select()
          .single();

        console.log('[useBandForm] Insert result:', { newBand, error });
        if (error) {
          console.error('[useBandForm] Insert error details:', error);
          throw error;
        }

        if (newBand) {
          // Add creator as founder
          const { error: memberError } = await supabase.from('band_members').insert({
            band_id: newBand.id,
            user_id: userId,
            role: 'founder',
          });
          if (memberError) throw memberError;

          if (selectedLogoFileId) {
            await supabase.from('file_usage').insert({
              file_id: selectedLogoFileId,
              usage_type: 'band_logo',
              reference_id: newBand.id,
            });
          }
          if (selectedBannerFileId) {
            await supabase.from('file_usage').insert({
              file_id: selectedBannerFileId,
              usage_type: 'band_banner',
              reference_id: newBand.id,
            });
          }

          toast({ title: 'Band opprettet!', description: `${formData.name} er nå opprettet` });
          return newBand as Band;
        }
      } else {
        await supabase
          .from('bands')
          .update({ ...bandData, updated_at: new Date().toISOString() })
          .eq('id', bandId!)
          .throwOnError();

        toast({ title: 'Band oppdatert!', description: 'Endringene har blitt lagret' });
        return null;
      }
    } catch (error: any) {
      toast({
        title: isCreate ? 'Feil ved oppretting' : 'Feil ved oppdatering',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
    return null;
  };

  const resetForm = () => {
    setFormData({ name: '', genre: '', description: '', bio: '', foundedYear: '' });
    setMusicLinks({ spotify: '', youtube: '', soundcloud: '', appleMusic: '', bandcamp: '' });
    setSocialLinks({ instagram: '', facebook: '', tiktok: '', twitter: '', website: '' });
    setContactInfo({ email: '', phone: '', bookingEmail: '' });
    setDiscography([]);
    setImages({ logo: null, banner: null });
  };

  return {
    formData,
    musicLinks,
    socialLinks,
    contactInfo,
    discography,
    images,
    setFormField,
    setMusicLink,
    setSocialLink,
    setContactField,
    addToDiscography,
    removeFromDiscography,
    setLogo,
    setBanner,
    handleSubmit,
    isSubmitting,
    resetForm,
  };
};
