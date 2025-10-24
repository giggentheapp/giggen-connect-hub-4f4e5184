import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { UserProfile } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminFilesSectionProps {
  profile: UserProfile;
}

export const AdminFilesSection = ({
  profile
}: AdminFilesSectionProps) => {
  const { t } = useAppTranslation();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col overflow-auto pb-24 md:pb-0">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('fileManagement')}</h1>
          <p className="text-sm text-muted-foreground">{t('managePortfolioFiles')}</p>
        </div>
        <Button onClick={() => navigate('/filbank')} variant="outline" size="lg">
          <Database className="mr-2 h-5 w-5" />
          Åpne Filbank
        </Button>
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
    </div>
  );
};