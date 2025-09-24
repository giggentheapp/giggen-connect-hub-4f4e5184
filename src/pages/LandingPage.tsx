import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, FileText, Music, Calendar, Star } from 'lucide-react';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageNotification } from '@/hooks/useLanguageNotification';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useAppLanguage();
  const { t } = useTranslation();
  useLanguageNotification(); // Add visual feedback for language changes

  const navigateToApp = () => {
    console.log('Navigating to main app with language:', language);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate('/about')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('about')}
              </button>
              <button 
                onClick={() => navigate('/privacy')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('privacy')}
              </button>
              <button 
                onClick={() => navigate('/terms')}
                className="text-foreground hover:text-primary transition-colors"
              >
                {t('terms')}
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              {/* Language selector */}
              <div className="flex items-center gap-2">
                <Button
                  variant={language === 'no' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage('no')}
                  className="transition-all"
                >
                  Norsk
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeLanguage('en')}
                  className="transition-all"
                >
                  English
                </Button>
              </div>
              <Button onClick={() => navigate('/auth')} variant="outline">
                {t('login')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent-orange to-accent-pink bg-clip-text text-transparent leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={navigateToApp}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all transform hover:scale-105"
            >
              <Music className="mr-2 h-5 w-5" />
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            {t('keyFeatures')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('listTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('listDescription')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-green/10 to-accent-blue/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-accent-green" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('bookingTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('bookingDescription')}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-accent-orange" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('profilesTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">{t('profilesDescription')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Users Split Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mr-4">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t('forMusicians')}</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {t('musicianFeature1')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {t('musicianFeature2')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {t('musicianFeature3')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {t('musicianFeature4')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 hover:border-accent-green/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-lg mr-4">
                    <Calendar className="h-8 w-8 text-accent-green" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t('forOrganizers')}</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-green rounded-full mr-3 flex-shrink-0"></div>
                    {t('organizerFeature1')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-green rounded-full mr-3 flex-shrink-0"></div>
                    {t('organizerFeature2')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-green rounded-full mr-3 flex-shrink-0"></div>
                    {t('organizerFeature3')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-green rounded-full mr-3 flex-shrink-0"></div>
                    {t('organizerFeature4')}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 hover:border-accent-blue/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-br from-accent-blue/10 to-accent-blue/20 rounded-lg mr-4">
                    <Users className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t('forAudience')}</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mr-3 flex-shrink-0"></div>
                    {t('audienceFeature1')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mr-3 flex-shrink-0"></div>
                    {t('audienceFeature2')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mr-3 flex-shrink-0"></div>
                    {t('audienceFeature3')}
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-blue rounded-full mr-3 flex-shrink-0"></div>
                    {t('audienceFeature4')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">GIGGEN</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>giggen.main@gmail.com</p>
                <p>Oslo, Norge</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                {t('legal')}
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/privacy')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('privacyPolicy')}
                </button>
                <button 
                  onClick={() => navigate('/terms')}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('termsConditions')}
                </button>
                <a 
                  href="#" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('cookiePolicy')}
                </a>
                <Button 
                  onClick={navigateToApp}
                  className="w-full mt-4"
                >
                  {t('getStarted')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;