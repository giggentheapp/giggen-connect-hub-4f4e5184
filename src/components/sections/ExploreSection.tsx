import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Map, Grid3X3, List, User, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MakerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: string;
  address: string | null;
  avatar_url: string | null;
}

export const ExploreSection = () => {
  const [makers, setMakers] = useState<MakerProfile[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchMakers();
  }, []);

  const fetchMakers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'maker')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMakers(data || []);
    } catch (error: any) {
      console.error('Error fetching makers:', error);
      toast({
        title: "Feil ved lasting av makere",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Utforsk Makere</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster makere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utforsk Makere</h1>
          <p className="text-muted-foreground">Oppdag kreative talenter i GIGGEN-nettverket</p>
        </div>
        
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Rutenett
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/map">
                <Map className="h-4 w-4 mr-1" />
                Vis kart
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile view toggle */}
      {isMobile && (
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex-1"
          >
            <List className="h-4 w-4 mr-1" />
            Liste
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to="/map">
              <Map className="h-4 w-4 mr-1" />
              Kart
            </Link>
          </Button>
        </div>
      )}

      {/* Makers display */}
      <div className={
        isMobile || viewMode === 'list' 
          ? 'space-y-4' 
          : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
      }>
        {makers.map((maker) => (
          <Card key={maker.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                  {maker.avatar_url ? (
                    <img 
                      src={maker.avatar_url} 
                      alt={maker.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{maker.display_name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="capitalize">{maker.role}</span>
                    {maker.address && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{maker.address}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {maker.bio && (
              <CardContent className="pt-0 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {maker.bio}
                </p>
              </CardContent>
            )}
            
            <CardContent className="pt-0">
              <Button asChild className="w-full" size="sm">
                <Link to={`/profile/${maker.user_id}`}>
                  Se profil
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {makers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Ingen makere funnet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};