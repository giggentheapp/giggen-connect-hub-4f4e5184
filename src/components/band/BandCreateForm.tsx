import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useBandForm } from '@/hooks/useBandForm';
import { useBandImages } from '@/hooks/useBandImages';
import { supabase } from '@/integrations/supabase/client';
import { BasicInfoTab } from './forms/BasicInfoTab';
import { TechSpecTab } from './forms/TechSpecTab';
import { HospitalityTab } from './forms/HospitalityTab';
import { PortfolioTab } from './forms/PortfolioTab';
import { SocialLinksTab } from './forms/SocialLinksTab';
import { MusicLinksTab } from './forms/MusicLinksTab';
import { BandFormHeader } from './forms/BandFormHeader';
import { BandFormTabs } from './forms/BandFormTabs';
import { BandFormActions } from './forms/BandFormActions';
import { BandImageModals } from './forms/BandImageModals';

interface BandCreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const BandCreateForm = ({ onSuccess, onCancel }: BandCreateFormProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const formHook = useBandForm();
  const imagesHook = useBandImages(userId || '');

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (imagesHook.logoPreview) {
      formHook.setLogo(imagesHook.logoPreview);
    }
  }, [imagesHook.logoPreview]);

  useEffect(() => {
    if (imagesHook.bannerPreview) {
      formHook.setBanner(imagesHook.bannerPreview);
    }
  }, [imagesHook.bannerPreview]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const newBand = await formHook.handleSubmit(
      userId,
      undefined,
      true,
      imagesHook.selectedLogoFileId,
      imagesHook.selectedBannerFileId
    );

    if (newBand) {
      onSuccess();
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-accent-blue/10 pb-20 md:pb-6">
      <div className="container max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
        <BandFormHeader title="Nytt band" onBack={onCancel} />

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <BandFormTabs />

            <TabsContent value="basic" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
              <BasicInfoTab
                formData={formHook.formData}
                onChange={formHook.setFormField}
                logoPreview={imagesHook.logoPreview}
                bannerPreview={imagesHook.bannerPreview}
                onSelectLogo={imagesHook.openFilebankForLogo}
                onSelectBanner={imagesHook.openFilebankForBanner}
                contactInfo={formHook.contactInfo}
                onContactChange={formHook.setContactField}
                discography={formHook.discography}
                onAddSong={formHook.addToDiscography}
                onRemoveSong={formHook.removeFromDiscography}
              />
            </TabsContent>

            <TabsContent value="tech" className="mt-4">
              <TechSpecTab userId={userId} />
            </TabsContent>

            <TabsContent value="hospitality" className="mt-4">
              <HospitalityTab userId={userId} />
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4">
              <PortfolioTab userId={userId} />
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <SocialLinksTab socialLinks={formHook.socialLinks} onChange={formHook.setSocialLink} />
            </TabsContent>

            <TabsContent value="music" className="mt-4">
              <MusicLinksTab musicLinks={formHook.musicLinks} onChange={formHook.setMusicLink} />
            </TabsContent>
          </Tabs>

          <BandFormActions
            isSubmitting={formHook.isSubmitting}
            onCancel={onCancel}
            submitLabel="Opprett band"
            isCreateMode
          />
        </form>

        <BandImageModals
          userId={userId}
          showFilebankModal={imagesHook.showFilebankModal}
          showCropModal={imagesHook.showCropModal}
          fileModalType={imagesHook.fileModalType}
          selectedImageForCrop={imagesHook.selectedImageForCrop}
          onCloseFilebank={imagesHook.closeFilebankModal}
          onFileSelected={imagesHook.handleFileSelected}
          onAvatarUpdate={imagesHook.handleCropComplete}
          onCloseCrop={imagesHook.closeModals}
          skipDatabaseUpdate={true}
        />
      </div>
    </div>
  );
};
