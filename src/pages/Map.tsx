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
        <div className="w-full px-3 py-3 md:px-4 md:py-4">
          <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h1 className="text-lg md:text-xl font-semibold">{t('map')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full px-3 py-4 md:px-4 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Coming soon card */}
          <Card className="text-center mx-2 md:mx-0">
            <CardHeader className="pb-4 px-4 md:px-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">{t('mapComingSoon')}</CardTitle>
              <CardDescription className="text-base md:text-lg mt-2 px-2">
                {t('Map Coming Soon Description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="flex flex-col items-center p-3 md:p-4 bg-muted/30 rounded-lg">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1 text-sm md:text-base">{t('upcomingEvents')}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    {t('See Upcoming Events In Area')}
                  </p>
                </div>
                <div className="flex flex-col items-center p-3 md:p-4 bg-muted/30 rounded-lg">
                  <Music className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1 text-sm md:text-base">{t('musiciansNearby')}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    {t('Find Musicians and Cooperate')}
                  </p>
                </div>
                <div className="flex flex-col items-center p-3 md:p-4 bg-muted/30 rounded-lg">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary mb-2" />
                  <h3 className="font-medium mb-1 text-sm md:text-base">{t('localVenues')}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    {t('')}
                  </p>
                </div>
              </div>

              {/* Call to action */}
              <div className="pt-2 md:pt-4">
                <p className="text-muted-foreground mb-4 text-sm md:text-base px-2">
                  {t('inTheMeantime')}
                </p>
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full md:w-auto min-h-[44px]"
                >
                  {t('Go To Explore Page')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="mt-6 md:mt-8 text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              {t('Under Development')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}