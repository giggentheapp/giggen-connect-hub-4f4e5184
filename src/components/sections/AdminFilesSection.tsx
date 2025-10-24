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
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{t('fileBank')}</h1>
            <p className="text-muted-foreground">{t('fileBankDescription')}</p>
          </div>
          
          <Button onClick={() => navigate('/filbank')} size="lg" className="gap-2">
            <Database className="h-5 w-5" />
            {t('openFileBank')}
          </Button>
        </div>
      </div>
    </div>
  );
};