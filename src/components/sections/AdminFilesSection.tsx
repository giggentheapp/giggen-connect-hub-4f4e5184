import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  avatar_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_address_public: boolean;
  contact_info: any;
}

interface AdminFilesSectionProps {
  profile: UserProfile;
}

export const AdminFilesSection = ({
  profile
}: AdminFilesSectionProps) => {
  const { t } = useAppTranslation();

  return <div className="space-y-6">
    <Card className="bg-slate-200">
      <CardHeader>
        <CardTitle>{t('fileManagement')}</CardTitle>
        <CardDescription>
          {t('managePortfolioFiles')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <ProfilePortfolioManager 
            userId={profile.user_id} 
            title={t('profilePortfolio')} 
            description={t('uploadPortfolioFiles')} 
          />
        </div>
        
        <div>
          <TechSpecManager 
            userId={profile.user_id} 
            title={t('technicalSpecifications')} 
            description={t('uploadTechSpecs')} 
          />
        </div>
        
        <div>
          <HospitalityRiderManager 
            userId={profile.user_id} 
            title={t('hospitalityRiders')} 
            description={t('uploadHospitalityRiders')} 
          />
        </div>
      </CardContent>
    </Card>
  </div>;
};