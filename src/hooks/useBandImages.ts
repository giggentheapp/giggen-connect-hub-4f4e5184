import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBandImages = (userId: string, bandId?: string) => {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [fileModalType, setFileModalType] = useState<'logo' | 'banner'>('logo');
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [selectedLogoFileId, setSelectedLogoFileId] = useState<string | null>(null);
  const [selectedBannerFileId, setSelectedBannerFileId] = useState<string | null>(null);

  const openFilebankForLogo = () => {
    setFileModalType('logo');
    setShowFilebankModal(true);
  };

  const openFilebankForBanner = () => {
    setFileModalType('banner');
    setShowFilebankModal(true);
  };

  const handleFileSelected = async (file: any) => {
    console.log('[useBandImages] File selected:', file.filename, 'Type:', fileModalType);
    try {
      const publicUrl = supabase.storage
        .from('filbank')
        .getPublicUrl(file.file_path).data.publicUrl;

      console.log('[useBandImages] Public URL:', publicUrl);

      if (fileModalType === 'logo') {
        console.log('[useBandImages] Setting up logo crop modal');
        setSelectedImageForCrop(publicUrl);
        setSelectedLogoFileId(file.id);
        setShowFilebankModal(false);
        setShowCropModal(true);
        console.log('[useBandImages] Crop modal should now be visible');
      } else {
        console.log('[useBandImages] Setting banner preview');
        setBannerPreview(publicUrl);
        setSelectedBannerFileId(file.id);
        setShowFilebankModal(false);
      }

      if (bandId) {
        try {
          await supabase.from('file_usage').insert({
            file_id: file.id,
            usage_type: fileModalType === 'logo' ? 'band_logo' : 'band_banner',
            reference_id: bandId,
          });
        } catch (error) {
          console.log('File usage error:', error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    console.log('[useBandImages] Crop completed, URL:', croppedUrl?.substring(0, 50));
    setLogoPreview(croppedUrl);
    setShowCropModal(false);
    setSelectedImageForCrop(null);
    console.log('[useBandImages] Logo preview set, modal closed');
  };

  const closeModals = () => {
    setShowFilebankModal(false);
    setShowCropModal(false);
    setSelectedImageForCrop(null);
  };

  return {
    logoPreview,
    bannerPreview,
    showFilebankModal,
    showCropModal,
    fileModalType,
    selectedImageForCrop,
    selectedLogoFileId,
    selectedBannerFileId,
    openFilebankForLogo,
    openFilebankForBanner,
    handleFileSelected,
    handleCropComplete,
    closeModals,
    setLogoPreview,
    setBannerPreview,
  };
};
