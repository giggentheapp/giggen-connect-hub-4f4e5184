import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import ConceptCard from '@/components/ConceptCard';

interface Concept {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  expected_audience: number | null;
  tech_spec: string | null;
  tech_spec_reference: string | null;
  available_dates: any;
  is_published: boolean;
  status: string;
  created_at: string;
  maker_id: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
}

const ConceptView = () => {
  const { conceptId } = useParams();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [maker, setMaker] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (conceptId) {
      loadConcept();
    }
  }, [conceptId]);

  const loadConcept = async () => {
    try {
      // Load concept
      const { data: conceptData, error: conceptError } = await supabase
        .from('concepts')
        .select('*')
        .eq('id', conceptId)
        .eq('is_published', true) // Only show published concepts
        .single();

      if (conceptError) {
        console.error('Error loading concept:', conceptError);
        toast({
          title: "Konsept ikke funnet",
          description: "Konseptet eksisterer ikke eller er ikke publisert",
          variant: "destructive",
        });
        return;
      }

      setConcept(conceptData);

      // Load maker profile
      const { data: makerData, error: makerError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, bio, avatar_url')
        .eq('user_id', conceptData.maker_id)
        .single();

      if (makerError) {
        console.error('Error loading maker profile:', makerError);
      } else {
        setMaker(makerData);
      }

    } catch (error: any) {
      console.error('Error loading concept:', error);
      toast({
        title: "Feil ved lasting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster tilbud...</p>
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Konsept ikke funnet</p>
            <Button asChild>
              <Link to="/dashboard">Tilbake til dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tilbudsvisning</h1>
              <p className="text-sm text-muted-foreground">
                Se detaljer for dette tilbudet
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Maker Info */}
        {maker && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {maker.avatar_url && (
                  <img 
                    src={maker.avatar_url} 
                    alt={maker.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <span>{maker.display_name}</span>
                  <p className="text-sm text-muted-foreground font-normal">
                    GiggenMaker
                  </p>
                </div>
              </CardTitle>
              {maker.bio && (
                <CardDescription>{maker.bio}</CardDescription>
              )}
            </CardHeader>
          </Card>
        )}

        {/* Concept Details */}
        <ConceptCard concept={concept} />
      </div>
    </div>
  );
};

export default ConceptView;