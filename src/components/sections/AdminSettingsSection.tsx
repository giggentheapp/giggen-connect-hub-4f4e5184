import { UserSettings } from '@/components/UserSettings';
import { UserProfile } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import { Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettingsSectionProps {
  profile: UserProfile;
}

export const AdminSettingsSection = ({ profile }: AdminSettingsSectionProps) => {
  const { t } = useAppTranslation();
  const { language, changeLanguage } = useAppLanguage();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setUserProfile(profileData);
      }
    };
    getCurrentUser();
  }, []);
  
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="max-w-4xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 space-y-6">
      {/* Header with language controls */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings')}</h1>
          <p className="text-muted-foreground">{t('settingsDescription')}</p>
        </div>
        
        {/* Language Settings - Top Right */}
        <div className="flex gap-1 md:gap-2">
          <Button 
            onClick={() => changeLanguage('no')}
            variant={language === 'no' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${language === 'no' ? 'shadow-glow' : ''}`}
          >
            🇳🇴 NO
          </Button>
          <Button 
            onClick={() => changeLanguage('en')}
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${language === 'en' ? 'shadow-glow' : ''}`}
          >
            🇬🇧 EN
          </Button>
        </div>
      </div>

      {/* User Settings */}
      {userProfile && (
        <UserSettings 
          profile={userProfile}
          onProfileUpdate={setUserProfile}
        />
      )}
      </div>
    </div>
  );
};