import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, MapPin, Settings, Briefcase, FileText, Lightbulb } from 'lucide-react';
import ConceptCard from '@/components/ConceptCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleProvider';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import giggenLogo from '@/assets/giggen-logo.png';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [maker, setMaker] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isArtist, isAudience } = useRole();
  const { t } = useAppTranslation();

  // Check if we came from bookings page
  const fromBookings = location.state?.from === 'bookings';

  const getNavigationItems = () => {
    if (isAudience) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
      ];
    } else if (isArtist) {
      return [
        { id: 'profile', label: t('profile'), icon: User, path: '/dashboard?section=profile' },
        { id: 'explore', label: t('explore'), icon: MapPin, path: '/dashboard?section=explore' },
        { id: 'admin-files', label: 'Filer', icon: FileText, path: '/dashboard?section=admin-files' },
        { id: 'admin-concepts', label: t('My Offers'), icon: Lightbulb, path: '/dashboard?section=admin-concepts' },
        { id: 'bookings', label: t('bookings'), icon: Briefcase, path: '/dashboard?section=bookings' },
        { id: 'settings', label: t('settings'), icon: Settings, path: '/dashboard?section=settings' }
      ];
    }
    return [];
  };

  const navItems = getNavigationItems();

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
        .maybeSingle();

      if (conceptError) {
        console.error('Error loading concept:', conceptError);
        toast({
          title: "Konsept ikke funnet",
          description: "Konseptet eksisterer ikke eller er ikke publisert",
          variant: "destructive",
        });
        return;
      }
      
      if (!conceptData) {
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
        .maybeSingle();

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
    <div className="relative min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed top-0 left-0 z-50 h-full">
          <div className="h-full w-16 bg-card border-r border-border shadow-lg overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-center">
                <img 
                  src={giggenLogo} 
                  alt="GIGGEN Logo" 
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <nav className="p-3 space-y-2 flex-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => navigate(item.path)} 
                      className={cn(
                        'w-full flex items-center justify-center p-3 rounded-lg transition-colors',
                        'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                      )}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1", !isMobile ? 'ml-16' : '', isMobile ? 'pb-20' : 'pb-6')}>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(fromBookings ? '/bookings?tab=ongoing' : '/bookings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
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
                    Artist
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
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button 
                  key={item.id} 
                  onClick={() => navigate(item.path)} 
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1',
                    'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default ConceptView;