import { Band } from '@/types/band';
import { useBandBasicInfo } from './useBandBasicInfo';
import { useBandLinks } from './useBandLinks';
import { useBandContact } from './useBandContact';
import { useBandDiscography } from './useBandDiscography';
import { useBandSubmission } from './useBandSubmission';
import { useState, useEffect } from 'react';

/**
 * Main hook that composes all band form hooks.
 * Provides backward-compatible API for existing components.
 */
export const useBandForm = (initialBand?: Band) => {
  const basicInfo = useBandBasicInfo(initialBand);
  const links = useBandLinks(initialBand);
  const contact = useBandContact(initialBand);
  const discography = useBandDiscography(initialBand);
  const submission = useBandSubmission();

  // Image state (kept here for backward compatibility)
  const [images, setImages] = useState<{ logo: string | null; banner: string | null }>({
    logo: null,
    banner: null,
  });

  useEffect(() => {
    if (initialBand) {
      setImages({
        logo: initialBand.image_url || null,
        banner: initialBand.banner_url || null,
      });
    }
  }, [initialBand]);

  const setLogo = (url: string | null) => {
    setImages(prev => ({ ...prev, logo: url }));
  };

  const setBanner = (url: string | null) => {
    setImages(prev => ({ ...prev, banner: url }));
  };

  // Backward-compatible API
  return {
    // Basic info
    formData: basicInfo.basicInfo,
    setFormField: basicInfo.setField,
    
    // Links
    musicLinks: links.musicLinks,
    socialLinks: links.socialLinks,
    setMusicLink: links.setMusicLink,
    setSocialLink: links.setSocialLink,
    
    // Contact
    contactInfo: contact.contactInfo,
    setContactField: contact.setField,
    
    // Discography
    discography: discography.discography,
    addToDiscography: discography.addSong,
    removeFromDiscography: discography.removeSong,
    
    // Images
    images,
    setLogo,
    setBanner,
    
    // Submission
    handleSubmit: async (
      bandId?: string,
      isCreate?: boolean,
      selectedLogoFileId?: string | null,
      selectedBannerFileId?: string | null
    ) => {
      return submission.submit(
        {
          basicInfo: basicInfo.basicInfo,
          musicLinks: links.musicLinks,
          socialLinks: links.socialLinks,
          contactInfo: contact.contactInfo,
          discography: discography.discography,
          images,
        },
        isCreate ? 'create' : 'edit',
        bandId,
        selectedLogoFileId,
        selectedBannerFileId
      );
    },
    isSubmitting: submission.isSubmitting,
    
    // Reset
    resetForm: () => {
      basicInfo.reset();
      links.reset();
      contact.reset();
      discography.reset();
      setImages({ logo: null, banner: null });
    },
  };
};
