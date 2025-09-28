import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import { useLanguageNotification } from '@/hooks/useLanguageNotification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';
import { UserSettings } from '@/components/UserSettings';
import { useRoleData } from '@/hooks/useRole';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Settings = () => {
  const { t } = useAppTranslation();
  const { language, changeLanguage } = useAppLanguage();
  useLanguageNotification(); // Add visual feedback for language changes
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(profileData);
      }
    };
    getCurrentUser();
  }, []);
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
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
            Norsk
          </Button>
          <Button 
            onClick={() => changeLanguage('en')}
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${language === 'en' ? 'shadow-glow' : ''}`}
          >
            English
          </Button>
        </div>
      </div>

      {/* All Settings in UserSettings Component */}
      {profile && (
        <UserSettings 
          profile={profile} 
          onProfileUpdate={setProfile}
        />
      )}
    </div>
  );
};