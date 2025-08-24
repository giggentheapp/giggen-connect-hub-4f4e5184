import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Map, User, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConceptWizard } from '@/components/ConceptWizard';
import ConceptCard from '@/components/ConceptCard';

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
  price: number | null;
  expected_audience: number | null;
  tech_spec: string | null;
  tech_spec_reference: string | null;
  available_dates: any;
  is_published: boolean;
  created_at: string;
  maker_id: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  max_participants: number | null;
  is_public: boolean;
  created_at: string;
}


interface MakerDashboardProps {
  profile: UserProfile;
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [conceptFiles, setConceptFiles] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch concepts
        const { data: conceptsData, error: conceptsError } = await supabase
          .from('concepts')
          .select('*')
          .eq('maker_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (conceptsError) throw conceptsError;
        setConcepts(conceptsData || []);

        // Fetch concept files for each concept
        if (conceptsData && conceptsData.length > 0) {
          const conceptIds = conceptsData.map(c => c.id);
          const { data: filesData, error: filesError } = await supabase
            .from('concept_files')
            .select('*')
            .in('concept_id', conceptIds)
            .eq('creator_id', profile.user_id);

          if (filesError) {
            console.error('Error fetching concept files:', filesError);
          } else {
            // Group files by concept_id
            const filesByConceptId: {[key: string]: any[]} = {};
            (filesData || []).forEach(file => {
              if (!filesByConceptId[file.concept_id]) {
                filesByConceptId[file.concept_id] = [];
              }
              filesByConceptId[file.concept_id].push(file);
            });
            setConceptFiles(filesByConceptId);
          }
        }

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('maker_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Feil ved lasting av data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.user_id, toast]);

  const refreshConcepts = async () => {
    const { data: conceptsData } = await supabase
      .from('concepts')
      .select('*')
      .eq('maker_id', profile.user_id)
      .order('created_at', { ascending: false });
    setConcepts(conceptsData || []);
    
    // Fetch concept files for refreshed concepts
    if (conceptsData && conceptsData.length > 0) {
      const conceptIds = conceptsData.map(c => c.id);
      const { data: filesData } = await supabase
        .from('concept_files')
        .select('*')
        .in('concept_id', conceptIds)
        .eq('creator_id', profile.user_id);

      // Group files by concept_id
      const filesByConceptId: {[key: string]: any[]} = {};
      (filesData || []).forEach(file => {
        if (!filesByConceptId[file.concept_id]) {
          filesByConceptId[file.concept_id] = [];
        }
        filesByConceptId[file.concept_id].push(file);
      });
      setConceptFiles(filesByConceptId);
    }
  };

  const handleDeleteConcept = async (conceptId: string) => {
    try {
      const { error } = await supabase
        .from('concepts')
        .delete()
        .eq('id', conceptId);

      if (error) throw error;

      toast({
        title: "Konsept slettet",
        description: "Konseptet ble slettet",
      });

      setConcepts(prev => prev.filter(c => c.id !== conceptId));
    } catch (error: any) {
      toast({
        title: "Feil ved sletting av konsept",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster dashboard...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="map">Live kart</TabsTrigger>
            <TabsTrigger value="concepts">Konsepter</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistikk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Konsepter:</span>
                      <span className="font-semibold">{concepts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrangementer:</span>
                      <span className="font-semibold">{events.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Arrangementer</CardTitle>
                  <CardDescription>
                    Dine kommende og tidligere arrangementer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          {event.event_date && (
                            <p>Dato: {new Date(event.event_date).toLocaleDateString('no-NO')}</p>
                          )}
                          {event.location && <p>Sted: {event.location}</p>}
                          {event.max_participants && (
                            <p>Max deltakere: {event.max_participants}</p>
                          )}
                          <p>
                            Synlighet: {event.is_public ? 'Offentlig' : 'Privat'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Du har ikke opprettet noen arrangementer ennå
                      </p>
                   )}
                 </div>
               </CardContent>
             </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Live kart
                </CardTitle>
                <CardDescription>
                  Se alle GIGGEN makere på kartet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Åpne kartet for å se alle GIGGEN makere som har valgt å være synlige
                  </p>
                  <Button asChild>
                    <Link to="/map">
                      Åpne kart
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concepts" className="space-y-6">
            {/* Concepts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Konsepter
                  <Button 
                    size="sm"
                    onClick={() => setShowWizard(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett konsept
                  </Button>
                </CardTitle>
                <CardDescription>
                  Opprett og administrer dine kreative konsepter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {concepts.map((concept) => (
                    <ConceptCard 
                      key={concept.id}
                      concept={concept}
                      showActions={true}
                      onDelete={() => handleDeleteConcept(concept.id)}
                    />
                  ))}
                  {concepts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Du har ikke opprettet noen konsepter ennå. Klikk "Opprett konsept" for å komme i gang.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Min profil
                </CardTitle>
                <CardDescription>
                  Gå til din profilside for å redigere informasjon og innstillinger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Se og rediger din profil, portefølje og filhåndtering
                  </p>
                  <Button asChild>
                    <Link to={`/profile/${profile.user_id}`}>
                      Gå til profil
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      <ConceptWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={refreshConcepts}
        userId={profile.user_id}
      />
    </div>
  );
};