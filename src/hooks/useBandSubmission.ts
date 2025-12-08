import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Band } from '@/types/band';
import { useToast } from '@/hooks/use-toast';

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

interface SubmissionData {
  basicInfo: {
    name: string;
    genre: string;
    description: string;
    bio: string;
    foundedYear: string;
  };
  musicLinks: MusicLinks;
  socialLinks: SocialLinks;
  contactInfo: ContactInfo;
  discography: string[];
  images: {
    logo: string | null;
    banner: string | null;
  };
}

export const useBandSubmission = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (
    data: SubmissionData,
    mode: 'create' | 'edit',
    bandId?: string,
    selectedLogoFileId?: string | null,
    selectedBannerFileId?: string | null
  ): Promise<Band | null> => {
    // Validate
    if (!data.basicInfo.name.trim()) {
      toast({
        title: 'Bandnavn er påkrevd',
        description: 'Du må fylle inn bandnavnet for å fortsette',
        variant: 'destructive',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Du må være logget inn for å opprette eller redigere band');
      }

      const bandData = {
        name: data.basicInfo.name.trim(),
        genre: data.basicInfo.genre.trim() || null,
        description: data.basicInfo.description.trim() || null,
        bio: data.basicInfo.bio.trim() || null,
        founded_year: data.basicInfo.foundedYear ? parseInt(data.basicInfo.foundedYear) : null,
        image_url: data.images.logo,
        banner_url: data.images.banner,
        music_links: {
          spotify: data.musicLinks.spotify?.trim() || undefined,
          youtube: data.musicLinks.youtube?.trim() || undefined,
          soundcloud: data.musicLinks.soundcloud?.trim() || undefined,
          appleMusic: data.musicLinks.appleMusic?.trim() || undefined,
          bandcamp: data.musicLinks.bandcamp?.trim() || undefined,
        },
        social_media_links: {
          instagram: data.socialLinks.instagram?.trim() || undefined,
          facebook: data.socialLinks.facebook?.trim() || undefined,
          tiktok: data.socialLinks.tiktok?.trim() || undefined,
          twitter: data.socialLinks.twitter?.trim() || undefined,
          website: data.socialLinks.website?.trim() || undefined,
        },
        contact_info: {
          email: data.contactInfo.email?.trim() || undefined,
          phone: data.contactInfo.phone?.trim() || undefined,
          booking_email: data.contactInfo.bookingEmail?.trim() || undefined,
        },
        discography: data.discography.length > 0 ? data.discography : null,
      };

      if (mode === 'create') {
        const { data: newBand, error: bandError } = await supabase
          .from('bands')
          .insert({
            ...bandData,
            created_by: user.id,
            is_public: false
          })
          .select()
          .single();

        if (bandError) throw bandError;

        // Track file usage
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

        toast({ 
          title: 'Band opprettet!', 
          description: `${data.basicInfo.name} er nå opprettet` 
        });
        return newBand as Band;
      } else {
        await supabase
          .from('bands')
          .update({ ...bandData, updated_at: new Date().toISOString() })
          .eq('id', bandId!)
          .throwOnError();

        toast({ 
          title: 'Band oppdatert!', 
          description: 'Endringene har blitt lagret' 
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: mode === 'create' ? 'Feil ved oppretting' : 'Feil ved oppdatering',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
  };
};
