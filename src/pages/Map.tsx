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
            </CardHeader>
            <CardContent className="px-4 md:px-6">
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}