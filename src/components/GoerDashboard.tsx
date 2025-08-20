import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, Calendar, Folder } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  role: 'maker' | 'goer';
  created_at: string;
  updated_at: string;
}

interface Concept {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  maker_id: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string | null;
  is_public: boolean;
  created_at: string;
  maker_id: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  maker_id: string;
}

interface GoerDashboardProps {
  profile: UserProfile;
}

export const GoerDashboard = ({ profile }: GoerDashboardProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [makers, setMakers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      // Load all public concepts
      const { data: conceptsData, error: conceptsError } = await supabase
        .from('concepts')
        .select('*')
        .order('created_at', { ascending: false });

      if (conceptsError) throw conceptsError;
      setConcepts(conceptsData || []);

      // Load all public portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;
      setPortfolioItems(portfolioData || []);

      // Load all public events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Load all makers
      const { data: makersData, error: makersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'maker')
        .order('created_at', { ascending: false });

      if (makersError) throw makersError;
      setMakers(makersData || []);

    } catch (error: any) {
      toast({
        title: "Feil ved lasting av data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMakerName = (makerId: string) => {
    const maker = makers.find(m => m.user_id === makerId);
    return maker?.display_name || 'Ukjent maker';
  };

  if (loading) {
    return <div className="text-center py-8">Laster Goer dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Goer Dashboard</h2>
        <p className="text-muted-foreground">
          Utforsk konsepter, porteføljer og arrangementer fra Makers
        </p>
      </div>

      {/* Makers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            GiggenMakers ({makers.length})
          </CardTitle>
          <CardDescription>
            Se alle Makers på plattformen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {makers.map((maker) => (
              <div key={maker.id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{maker.display_name}</h4>
                {maker.bio && (
                  <p className="text-sm text-muted-foreground mt-1">{maker.bio}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Medlem siden {new Date(maker.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {makers.length === 0 && (
              <p className="text-muted-foreground text-center py-4 col-span-full">
                Ingen Makers funnet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Concepts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Konsepter ({concepts.length})
          </CardTitle>
          <CardDescription>
            Se alle offentlige konsepter fra Makers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {concepts.map((concept) => (
              <div key={concept.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{concept.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    av {getMakerName(concept.maker_id)}
                  </span>
                </div>
                {concept.description && (
                  <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">
                    {concept.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(concept.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {concepts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen konsepter å vise</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Porteføljer ({portfolioItems.length})
          </CardTitle>
          <CardDescription>
            Se offentlige portefølje-elementer fra Makers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {portfolioItems.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    av {getMakerName(item.maker_id)}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <div className="flex justify-between items-center mt-3">
                  {item.media_type && (
                    <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">
                      {item.media_type}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {portfolioItems.length === 0 && (
              <p className="text-muted-foreground text-center py-4 col-span-full">
                Ingen portefølje-elementer å vise
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Arrangementer ({events.length})
          </CardTitle>
          <CardDescription>
            Se kommende offentlige arrangementer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    av {getMakerName(event.maker_id)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                {event.location && (
                  <p className="text-sm mt-2">📍 {event.location}</p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Opprettet {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen arrangementer å vise</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};