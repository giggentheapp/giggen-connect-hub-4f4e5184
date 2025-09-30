import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProfileConceptView = () => {
  const { userId, conceptId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [concept, setConcept] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConcept = async () => {
      try {
        const { data: conceptData, error } = await supabase
          .from('concepts')
          .select('*')
          .eq('id', conceptId)
          .eq('is_published', true)
          .maybeSingle();

        if (error) throw error;
        
        setConcept(conceptData);
      } catch (error: any) {
        console.error('Error loading concept:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste tilbudet",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (conceptId) {
      loadConcept();
    }
  }, [conceptId, toast]);

  const handleClose = () => {
    navigate(`/profile/${userId}`);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Tilbud ikke funnet</p>
            <Button onClick={handleClose}>Tilbake til profil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til profil
            </Button>
          </div>
        </div>
      </header>

      {/* Fullscreen concept details */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{concept.title}</h1>
              {concept.description && (
                <p className="text-muted-foreground text-lg">{concept.description}</p>
              )}
            </div>

            {/* Pricing info */}
            <div className="flex flex-wrap gap-2">
              {concept.price && !concept.door_deal && !concept.price_by_agreement && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {concept.price} kr
                </Badge>
              )}
              {concept.door_deal && concept.door_percentage && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {concept.door_percentage}% av dørinntekter
                </Badge>
              )}
              {concept.price_by_agreement && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Pris ved avtale
                </Badge>
              )}
              {concept.expected_audience && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {concept.expected_audience} publikum
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileConceptView;
