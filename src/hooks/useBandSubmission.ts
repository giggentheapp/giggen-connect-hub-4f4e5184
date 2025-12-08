import { useCreateBand, useUpdateBand } from './useBandMutations';
import { supabase } from '@/integrations/supabase/client';
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

/**
 * Wrapper hook that uses React Query mutations
 * Provides backward-compatible API for useBandForm
 */
export const useBandSubmission = () => {
  const { toast } = useToast();
  const createMutation = useCreateBand();
  const updateMutation = useUpdateBand();

  const submit = async (
    data: SubmissionData,
    mode: 'create' | 'edit',
    bandId?: string,
    selectedLogoFileId?: string | null,
    selectedBannerFileId?: string | null
  ): Promise<any> => {
    // Validate
    if (!data.basicInfo.name.trim()) {
      toast({
        title: 'Bandnavn er påkrevd',
        description: 'Du må fylle inn bandnavnet for å fortsette',
        variant: 'destructive',
      });
      return null;
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

    try {
      if (mode === 'create') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Du må være logget inn');

        return await createMutation.mutateAsync({
          ...bandData,
          userId: user.id,
          selectedLogoFileId,
          selectedBannerFileId,
        });
      } else {
        return await updateMutation.mutateAsync({
          bandId: bandId!,
          data: bandData,
        });
      }
    } catch (error) {
      // Errors are already handled by mutations
      return null;
    }
  };

  return {
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
};
