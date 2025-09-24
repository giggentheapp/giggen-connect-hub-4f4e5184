import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, Calendar, Music, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export default function Map() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">{t('map')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Coming soon card */}
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('mapComingSoon')}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {t('mapComingSoonDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                  <Calendar className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1">{t('upcomingEvents')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('seeAllEventsOnMap')}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                  <Music className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1">{t('musiciansNearby')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('findTalentedMusicians')}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1">{t('localCommunity')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('exploreLocalMusic')}
                  </p>
                </div>
              </div>

              {/* Call to action */}
              <div className="pt-4">
                <p className="text-muted-foreground mb-4">
                  {t('inTheMeantime')}
                </p>
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full md:w-auto"
                >
                  {t('goToExplore')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              {t('underDevelopment')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}