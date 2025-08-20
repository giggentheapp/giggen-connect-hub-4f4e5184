import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string | null;
  is_public: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
}

interface MakerDashboardProps {
  profile: UserProfile;
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states for creating new items
  const [newConcept, setNewConcept] = useState({ title: '', description: '' });
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: '', description: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '' });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load concepts
      const { data: conceptsData, error: conceptsError } = await supabase
        .from('concepts')
        .select('*')
        .eq('maker_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (conceptsError) throw conceptsError;
      setConcepts(conceptsData || []);

      // Load portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('maker_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;
      setPortfolioItems(portfolioData || []);

      // Load events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('maker_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

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

  const createConcept = async () => {
    if (!newConcept.title.trim()) return;

    try {
      const { error } = await supabase
        .from('concepts')
        .insert({
          maker_id: profile.user_id,
          title: newConcept.title,
          description: newConcept.description || null,
        });

      if (error) throw error;

      toast({
        title: "Konsept opprettet",
        description: "Nytt konsept ble opprettet",
      });

      setNewConcept({ title: '', description: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse av konsept",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createPortfolioItem = async () => {
    if (!newPortfolioItem.title.trim()) return;

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          maker_id: profile.user_id,
          title: newPortfolioItem.title,
          description: newPortfolioItem.description || null,
          media_type: 'text', // For now, just text items
          is_public: true,
        });

      if (error) throw error;

      toast({
        title: "Portefølje-element opprettet",
        description: "Nytt element ble lagt til porteføljen",
      });

      setNewPortfolioItem({ title: '', description: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse av portefølje-element",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createEvent = async () => {
    if (!newEvent.title.trim()) return;

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          maker_id: profile.user_id,
          title: newEvent.title,
          description: newEvent.description || null,
          location: newEvent.location || null,
          is_public: true,
        });

      if (error) throw error;

      toast({
        title: "Arrangement opprettet",
        description: "Nytt arrangement ble opprettet",
      });

      setNewEvent({ title: '', description: '', location: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse av arrangement",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laster Maker dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Maker Dashboard</h2>
        <p className="text-muted-foreground">
          Administrer dine konsepter, portefølje og arrangementer
        </p>
      </div>

      {/* Concepts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Mine Konsepter ({concepts.length})
          </CardTitle>
          <CardDescription>
            Opprett og administrer dine kreative konsepter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new concept */}
          <div className="grid gap-4 p-4 border rounded-lg">
            <h4 className="font-medium">Opprett nytt konsept</h4>
            <div className="grid gap-2">
              <Label htmlFor="concept-title">Tittel</Label>
              <Input
                id="concept-title"
                value={newConcept.title}
                onChange={(e) => setNewConcept(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Konsept tittel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="concept-description">Beskrivelse</Label>
              <Textarea
                id="concept-description"
                value={newConcept.description}
                onChange={(e) => setNewConcept(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskrivelse av konseptet"
              />
            </div>
            <Button onClick={createConcept} disabled={!newConcept.title.trim()}>
              Opprett konsept
            </Button>
          </div>

          {/* List existing concepts */}
          <div className="space-y-2">
            {concepts.map((concept) => (
              <div key={concept.id} className="p-3 border rounded">
                <h4 className="font-medium">{concept.title}</h4>
                {concept.description && (
                  <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Status: {concept.status} • {new Date(concept.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {concepts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen konsepter opprettet ennå</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Min Portefølje ({portfolioItems.length})
          </CardTitle>
          <CardDescription>
            Vis frem dine beste arbeider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new portfolio item */}
          <div className="grid gap-4 p-4 border rounded-lg">
            <h4 className="font-medium">Legg til i portefølje</h4>
            <div className="grid gap-2">
              <Label htmlFor="portfolio-title">Tittel</Label>
              <Input
                id="portfolio-title"
                value={newPortfolioItem.title}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Prosjekt tittel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portfolio-description">Beskrivelse</Label>
              <Textarea
                id="portfolio-description"
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskrivelse av prosjektet"
              />
            </div>
            <Button onClick={createPortfolioItem} disabled={!newPortfolioItem.title.trim()}>
              Legg til i portefølje
            </Button>
          </div>

          {/* List existing portfolio items */}
          <div className="space-y-2">
            {portfolioItems.map((item) => (
              <div key={item.id} className="p-3 border rounded">
                <h4 className="font-medium">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {item.is_public ? 'Offentlig' : 'Privat'} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {portfolioItems.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen portefølje-elementer ennå</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Mine Arrangementer ({events.length})
          </CardTitle>
          <CardDescription>
            Planlegg og administrer dine arrangementer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new event */}
          <div className="grid gap-4 p-4 border rounded-lg">
            <h4 className="font-medium">Opprett nytt arrangement</h4>
            <div className="grid gap-2">
              <Label htmlFor="event-title">Tittel</Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Arrangement tittel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">Beskrivelse</Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskrivelse av arrangementet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-location">Sted</Label>
              <Input
                id="event-location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Hvor skal arrangementet holdes?"
              />
            </div>
            <Button onClick={createEvent} disabled={!newEvent.title.trim()}>
              Opprett arrangement
            </Button>
          </div>

          {/* List existing events */}
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="p-3 border rounded">
                <h4 className="font-medium">{event.title}</h4>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                {event.location && (
                  <p className="text-sm mt-1">📍 {event.location}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {event.is_public ? 'Offentlig' : 'Privat'} • {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen arrangementer opprettet ennå</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};