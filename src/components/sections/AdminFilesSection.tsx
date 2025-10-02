import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';

interface AdminFilesSectionProps {
  profile: UserProfile;
}

export const AdminFilesSection = ({
  profile
}: AdminFilesSectionProps) => {
  const { t } = useAppTranslation();

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('fileManagement')}</h1>
        <p className="text-sm text-muted-foreground">{t('managePortfolioFiles')}</p>
      </div>

      <div className="space-y-8">
        <ProfilePortfolioManager 
          userId={profile.user_id} 
          title={t('profilePortfolio')} 
          description={t('uploadPortfolioFiles')} 
        />
        
        <TechSpecManager 
          userId={profile.user_id} 
          title={t('technicalSpecifications')} 
          description={t('uploadTechSpecs')} 
        />
        
        <HospitalityRiderManager 
          userId={profile.user_id} 
          title={t('hospitalityRiders')} 
          description={t('uploadHospitalityRiders')} 
        />
      </div>
    </div>
  );
};