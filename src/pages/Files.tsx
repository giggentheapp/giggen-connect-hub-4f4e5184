import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProfilePortfolioManager from '@/components/ProfilePortfolioManager';
import TechSpecManager from '@/components/TechSpecManager';
import HospitalityRiderManager from '@/components/HospitalityRiderManager';

const Files = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          toast({
            title: "Ikke innlogget",
            description: "Du må være innlogget for å se denne siden",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Filer</h1>
              <p className="text-muted-foreground">
                Administrer portefølje, tech specs og hospitality riders
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <ProfilePortfolioManager
            userId={user.id}
            title="Profilportefølje"
            description="Last opp bilder, videoer og andre mediefiler som viser ditt arbeid"
          />

          <TechSpecManager
            userId={user.id}
            title="Tekniske spesifikasjoner"
            description="Last opp dokumenter som beskriver tekniske krav for dine konsepter"
          />

          <HospitalityRiderManager
            userId={user.id}
            title="Hospitality Riders"
            description="Last opp dokumenter som beskriver hospitality-krav for dine arrangementer"
          />
        </div>
      </main>
    </div>
  );
};

export default Files;