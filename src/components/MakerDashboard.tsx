import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Folder, FileText } from 'lucide-react';
import FileUpload from './FileUpload';
import FileViewer from './FileViewer';
import { Link } from 'react-router-dom';

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

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string | null;
  media_url: string | null;
  is_public: boolean;
  created_at: string;
}

interface FileItem {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  is_public: boolean;
  created_at: string;
}

interface MakerDashboardProps {
  profile: UserProfile;
}

export const MakerDashboard = ({ profile }: MakerDashboardProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<FileItem[]>([]);
  const [conceptFiles, setConceptFiles] = useState<{ [key: string]: FileItem[] }>({});
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newConcept, setNewConcept] = useState({ title: '', description: '' });
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
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

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('maker_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Fetch portfolio items
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('maker_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (portfolioError) throw portfolioError;
        setPortfolioItems(portfolioData || []);

        // Fetch portfolio files
        const { data: portfolioFilesData, error: portfolioFilesError } = await supabase
          .from('portfolio_files')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (portfolioFilesError) throw portfolioFilesError;
        setPortfolioFiles(portfolioFilesData || []);

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

  const fetchConceptFiles = async (conceptId: string) => {
    try {
      const { data: conceptFilesData, error } = await supabase
        .from('concept_files')
        .select('*')
        .eq('concept_id', conceptId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setConceptFiles(prev => ({
        ...prev,
        [conceptId]: conceptFilesData || []
      }));
    } catch (error: any) {
      console.error('Error fetching concept files:', error);
      toast({
        title: "Feil ved lasting av konseptfiler",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateConcept = async () => {
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
      setEditingConcept(null);
      
      // Refresh concepts
      const { data: conceptsData } = await supabase
        .from('concepts')
        .select('*')
        .eq('maker_id', profile.user_id)
        .order('created_at', { ascending: false });
      setConcepts(conceptsData || []);
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse av konsept",
        description: error.message,
        variant: "destructive",
      });
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
      
      // Clear concept files if this concept was selected
      if (selectedConceptId === conceptId) {
        setSelectedConceptId(null);
      }
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">GiggenMaker Dashboard</h2>
        <Button asChild>
          <Link to={`/profile/${profile.user_id}`}>
            Se min profil
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laster dashboard...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="portfolio">Portefølje</TabsTrigger>
            <TabsTrigger value="concepts">Konsepter</TabsTrigger>
            <TabsTrigger value="files">Filhåndtering</TabsTrigger>
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
                    <div className="flex justify-between">
                      <span>Porteføljeprosjekter:</span>
                      <span className="font-semibold">{portfolioItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Porteføljefiler:</span>
                      <span className="font-semibold">{portfolioFiles.length}</span>
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

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Portfolio Files Upload */}
              <FileUpload
                bucketName="portfolio"
                folderPath={profile.user_id}
                onFileUploaded={(file) => {
                  setPortfolioFiles(prev => [file, ...prev]);
                }}
              />

              {/* Portfolio Files Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Mine porteføljefiler
                  </CardTitle>
                  <CardDescription>
                    Alle dine opplastede porteføljefiler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileViewer
                    files={portfolioFiles}
                    bucketName="portfolio"
                    canDelete={true}
                    onFileDeleted={(fileId) => {
                      setPortfolioFiles(prev => prev.filter(f => f.id !== fileId));
                    }}
                  />
                </CardContent>
              </Card>

              {/* Legacy Portfolio Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Porteføljeprosjekter</CardTitle>
                  <CardDescription>
                    Dine porteføljeprosjekter og arbeider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          <p>
                            Type: {item.media_type || 'Ikke spesifisert'} • 
                            Synlighet: {item.is_public ? 'Offentlig' : 'Privat'} • 
                            Opprettet: {new Date(item.created_at).toLocaleDateString('no-NO')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {portfolioItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Du har ikke lagt til noen porteføljeprosjekter ennå
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="concepts" className="space-y-6">
            {/* Concepts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Konsepter
                  <Button 
                    size="sm"
                    onClick={() => setEditingConcept('new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nytt konsept
                  </Button>
                </CardTitle>
                <CardDescription>
                  Opprett og administrer dine kreative konsepter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingConcept === 'new' && (
                  <div className="mb-4 p-4 border rounded-lg">
                    <div className="space-y-4">
                      <Input
                        placeholder="Konsepttittel"
                        value={newConcept.title}
                        onChange={(e) => setNewConcept(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Beskrivelse av konseptet"
                        value={newConcept.description}
                        onChange={(e) => setNewConcept(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreateConcept} size="sm">
                          Opprett konsept
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingConcept(null);
                            setNewConcept({ title: '', description: '' });
                          }}
                          size="sm"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {concepts.map((concept) => (
                    <div key={concept.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{concept.title}</h3>
                          {concept.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {concept.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Status: {concept.status} • Opprettet: {new Date(concept.created_at).toLocaleDateString('no-NO')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConceptId(concept.id);
                              fetchConceptFiles(concept.id);
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Filer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingConcept(concept.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConcept(concept.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {concepts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Du har ikke opprettet noen konsepter ennå
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Concept Files Management */}
            {selectedConceptId && (
              <div className="space-y-6">
                <FileUpload
                  bucketName="concepts"
                  folderPath={`${profile.user_id}/${selectedConceptId}`}
                  onFileUploaded={(file) => {
                    setConceptFiles(prev => ({
                      ...prev,
                      [selectedConceptId]: [file, ...(prev[selectedConceptId] || [])]
                    }));
                  }}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Konseptfiler
                    </CardTitle>
                    <CardDescription>
                      Filer for valgt konsept
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileViewer
                      files={conceptFiles[selectedConceptId] || []}
                      bucketName="concepts"
                      canDelete={true}
                      onFileDeleted={(fileId) => {
                        setConceptFiles(prev => ({
                          ...prev,
                          [selectedConceptId]: prev[selectedConceptId]?.filter(f => f.id !== fileId) || []
                        }));
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* All Portfolio Files */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle porteføljefiler</CardTitle>
                  <CardDescription>
                    Oversikt over alle dine porteføljefiler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">Totalt: {portfolioFiles.length} filer</p>
                    <div className="text-xs text-muted-foreground">
                      <p>Bilder: {portfolioFiles.filter(f => f.file_type === 'image').length}</p>
                      <p>Videoer: {portfolioFiles.filter(f => f.file_type === 'video').length}</p>
                      <p>Lyd: {portfolioFiles.filter(f => f.file_type === 'audio').length}</p>
                      <p>Dokumenter: {portfolioFiles.filter(f => f.file_type === 'document').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Concept Files */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle konseptfiler</CardTitle>
                  <CardDescription>
                    Oversikt over alle dine konseptfiler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(conceptFiles).map(([conceptId, files]) => {
                      const concept = concepts.find(c => c.id === conceptId);
                      return (
                        <div key={conceptId} className="p-2 border rounded">
                          <p className="font-medium text-sm">{concept?.title || 'Ukjent konsept'}</p>
                          <p className="text-xs text-muted-foreground">{files.length} filer</p>
                        </div>
                      );
                    })}
                    {Object.keys(conceptFiles).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Ingen konseptfiler lastet ennå
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};