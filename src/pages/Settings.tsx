import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Shield, Bell, User } from 'lucide-react';

export const Settings = () => {
  const { t } = useAppTranslation();
  const { language, changeLanguage } = useAppLanguage();
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings')}</h1>
        <p className="text-muted-foreground">Administrer dine app-innstillinger og preferanser</p>
      </div>

      {/* Language Settings */}
      <Card className="border-2 hover:border-primary/50 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-accent-blue/10 rounded-lg">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            {t('languageSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('chooseLanguage')}</p>
              <p className="text-sm text-muted-foreground">Velg språk for appen / Choose your app language</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {language === 'no' ? 'Norsk' : 'English'}
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => changeLanguage('no')}
              variant={language === 'no' ? 'default' : 'outline'}
              className={`flex items-center gap-2 transition-all ${
                language === 'no' ? 'shadow-glow' : ''
              }`}
            >
              🇳🇴 {t('norwegian')}
            </Button>
            <Button 
              onClick={() => changeLanguage('en')}
              variant={language === 'en' ? 'default' : 'outline'}
              className={`flex items-center gap-2 transition-all ${
                language === 'en' ? 'shadow-glow' : ''
              }`}
            >
              🇬🇧 {t('english')}
            </Button>
          </div>
          
          {/* Debug info */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p>Debug: Current language = {language}</p>
            <p>Storage key: mainAppLanguage = {localStorage.getItem('mainAppLanguage')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings Preview */}
      <Card className="border-2 hover:border-accent-green/50 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent-green/10 to-accent-blue/10 rounded-lg">
              <Shield className="h-5 w-5 text-accent-green" />
            </div>
            {t('privacySettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Administrer hvem som kan se din profil og informasjon</p>
          <Button variant="outline" className="mt-3" disabled>
            Kommer snart / Coming soon
          </Button>
        </CardContent>
      </Card>

      {/* Additional Settings Placeholder */}
      <Card className="border-2 hover:border-accent-orange/50 transition-all opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 rounded-lg">
              <Bell className="h-5 w-5 text-accent-orange" />
            </div>
            Varsler / Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Administrer varsler og notifikasjoner</p>
          <Button variant="outline" className="mt-3" disabled>
            Kommer snart / Coming soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};