import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Music, Users, MapPin, Target, Heart } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { navigateBack, navigateToAuth } from '@/lib/navigation';

const About = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigateBack(navigate, location, '/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div className="text-2xl font-bold text-primary">GIGGEN</div>
            <Button onClick={() => navigateToAuth(navigate, false)} variant="outline">
              {t('signIn')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent-orange to-accent-pink bg-clip-text text-transparent">
              {t('aboutGiggen')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t('aboutGiggenDescription')}
            </p>
          </div>

          {/* Vision */}
          <Card className="mb-12 border-2 hover:border-primary/50 transition-all">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg mr-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t('ourVision')}</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('visionDescription')}
              </p>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-blue/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-blue/10 to-accent-blue/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-accent-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('geographicDiscovery')}</h3>
                <p className="text-muted-foreground">
                  {t('geographicDescription')}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-green/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-accent-green" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('smartMatching')}</h3>
                <p className="text-muted-foreground">
                  {t('smartMatchingDescription')}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all border-2 hover:border-accent-orange/50">
              <CardContent className="p-6">
                <div className="p-4 bg-gradient-to-br from-accent-orange/10 to-accent-orange/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Music className="h-8 w-8 text-accent-orange" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('professionalProfiles')}</h3>
                <p className="text-muted-foreground">
                  {t('professionalProfilesDescription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mission */}
          <Card className="mb-12 border-2 hover:border-accent-pink/50 transition-all">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-accent-pink/10 to-accent-pink/20 rounded-lg mr-4">
                  <Heart className="h-8 w-8 text-accent-pink" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t('ourMission')}</h2>
              </div>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  {t('missionDescription')}
                </p>
                <p>
                  {t('missionDescription2')}
                </p>
                <p>
                  {t('missionDescription3')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">{t('joinTheJourney')}</h3>
            <p className="text-lg text-muted-foreground mb-8">
              {t('inviteToJoin')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigateToAuth(navigate, false)}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
              >
                {t('registerAsMusician')}
              </Button>
              <Button 
                onClick={() => navigateToAuth(navigate, false)}
                variant="outline"
                size="lg"
                className="border-2 hover:bg-primary hover:text-primary-foreground"
              >
                {t('registerAsOrganizer')}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center space-x-8 mb-4">
            <button 
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('privacyPolicy')}
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('termsAndConditions')}
            </button>
            <a 
              href="mailto:info@giggen.org"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('contact')}
            </a>
          </div>
          <p className="text-muted-foreground">&copy; 2024 Giggen AS. {t('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
};

export default About;