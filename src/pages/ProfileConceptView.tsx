import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Banknote, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConceptPortfolioGallery } from '@/components/ConceptPortfolioGallery';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { conceptService } from '@/services/conceptService';
import { handleError } from '@/lib/errorHandler';


const ProfileConceptView = () => {
  const { userId, conceptId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [concept, setConcept] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    const loadConcept = async () => {
      if (!conceptId) return;
      
      try {
        const data = await conceptService.getById(conceptId, false);
        setConcept(data);
      } catch (error: any) {
        const message = handleError(error, 'ProfileConceptView.loadConcept');
        toast({
          title: "Feil",
          description: message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadConcept();
  }, [conceptId, toast]);

  const parseAvailableDates = (datesData: any) => {
    if (!datesData) return { dates: [], isIndefinite: false };
    try {
      const dates = typeof datesData === 'string' ? JSON.parse(datesData) : datesData;
      if (dates && typeof dates === 'object' && dates.indefinite) {
        return { dates: [], isIndefinite: true };
      }
      return { dates: Array.isArray(dates) ? dates : [], isIndefinite: false };
    } catch {
      return { dates: [], isIndefinite: false };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Tilbud ikke funnet</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til profil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept.available_dates);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til profil
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold">{concept.title}</h1>
            <Badge className="bg-gradient-to-r from-accent-orange to-accent-pink text-white">
              Tilbud
            </Badge>
          </div>
          
          {concept.description && (
            <p className="text-lg text-muted-foreground mt-4 whitespace-pre-wrap">
              {concept.description}
            </p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(concept.price || concept.door_deal || concept.price_by_agreement) && (
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Pris</p>
                <p className="text-muted-foreground">
                  {concept.door_deal && concept.door_percentage
                    ? `${concept.door_percentage}% av dørsalg`
                    : concept.price_by_agreement
                    ? 'Etter avtale'
                    : `${concept.price} kr`}
                </p>
              </div>
            </div>
          )}

          {(availableDates.length > 0 || isIndefinite) && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Tilgjengelige datoer</p>
                {isIndefinite ? (
                  <p className="text-muted-foreground">Etter avtale</p>
                ) : (
                  <div className="text-muted-foreground">
                    {availableDates.slice(0, 3).map((date: string, idx: number) => (
                      <p key={idx}>{format(new Date(date), 'EEEE d. MMMM yyyy', { locale: nb })}</p>
                    ))}
                    {availableDates.length > 3 && (
                      <p className="text-sm italic">+{availableDates.length - 3} flere datoer</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {concept.expected_audience && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-accent-orange mt-1" />
              <div>
                <p className="font-medium">Forventet publikum</p>
                <p className="text-muted-foreground">{concept.expected_audience} personer</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Gallery */}
        {conceptId && (
          <div className="mt-8">
            <ConceptPortfolioGallery conceptId={conceptId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileConceptView;
