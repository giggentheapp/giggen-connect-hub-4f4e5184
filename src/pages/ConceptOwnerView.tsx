import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarIcon, Users, DollarSign, FileText, Edit, Eye, EyeOff, Expand, Play, Music as MusicIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface Concept {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  expected_audience: number | null;
  tech_spec: string | null;
  tech_spec_reference: string | null;
  hospitality_rider_reference?: string | null;
  available_dates: any;
  is_published: boolean;
  status: string;
  created_at: string;
  maker_id: string;
  door_deal?: boolean;
  door_percentage?: number | null;
  price_by_agreement?: boolean;
}

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  file_path: string;
  title?: string;
  created_at: string;
  mime_type?: string;
  thumbnail_path?: string;
}

export default function ConceptOwnerView() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ConceptFile | null>(null);

  useEffect(() => {
    if (conceptId) {
      loadConceptData(conceptId);
    }
  }, [conceptId]);

  const loadConceptData = async (id: string) => {
    setLoading(true);
    try {
      console.log('🔍 Loading concept with ID:', id);
      
      // Load concept
      const { data: conceptData, error: conceptError } = await supabase
        .from('concepts')
        .select('*')
        .eq('id', id)
        .single();

      console.log('📊 Concept query result:', { data: conceptData, error: conceptError });

      if (conceptError) {
        console.error('❌ Concept error:', conceptError);
        toast({
          title: 'Kunne ikke laste tilbud',
          description: 'Tilbudet ble ikke funnet eller du har ikke tilgang til det',
          variant: 'destructive',
        });
        // Navigate back to offers section instead of generic dashboard
        setTimeout(() => navigate('/dashboard?section=admin-concepts'), 2000);
        return;
      }
      
      if (!conceptData) {
        console.warn('⚠️ No concept data returned');
        toast({
          title: 'Tilbud ikke funnet',
          description: 'Dette tilbudet eksisterer ikke',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/dashboard?section=admin-concepts'), 2000);
        return;
      }

      setConcept(conceptData);

      // Load concept files
      const { data: filesData, error: filesError } = await supabase
        .from('concept_files')
        .select('id, filename, file_type, file_url, file_path, title, created_at, mime_type, thumbnail_path')
        .eq('concept_id', id)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('❌ Files error:', filesError);
      }
      
      setConceptFiles(filesData || []);
    } catch (error: any) {
      console.error('💥 Unexpected error loading concept:', error);
      toast({
        title: 'Feil ved lasting',
        description: error.message || 'Noe gikk galt',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/dashboard?section=admin-concepts'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async () => {
    if (!concept) return;

    try {
      const newState = !concept.is_published;
      const { error } = await supabase
        .from('concepts')
        .update({ 
          is_published: newState,
          updated_at: new Date().toISOString()
        })
        .eq('id', concept.id);

      if (error) throw error;

      setConcept({ ...concept, is_published: newState });
      toast({
        title: newState ? '✅ Tilbud publisert' : '🔒 Tilbud skjult',
        description: newState 
          ? 'Tilbudet er nå synlig på profilsiden' 
          : 'Tilbudet er nå skjult fra profilsiden',
      });
    } catch (error: any) {
      toast({
        title: 'Kunne ikke endre synlighet',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const parseAvailableDates = (datesData: any) => {
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

  const getPublicUrl = (filePath: string) => {
    return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${filePath}`;
  };

  const isVideoFile = (file: ConceptFile) => {
    return file.file_type === 'video' || file.mime_type?.startsWith('video/');
  };

  const isAudioFile = (file: ConceptFile) => {
    return file.file_type === 'audio' || file.mime_type?.startsWith('audio/');
  };

  const renderFilePreview = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file.file_path);

    // Image
    if (file.file_type === 'image' || file.mime_type?.startsWith('image/')) {
      return (
        <div className="relative w-full h-full group">
          <img
            src={publicUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Video with thumbnail
    if (isVideoFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
          <img
            src={thumbnailUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Video without thumbnail
    if (isVideoFile(file)) {
      return (
        <div className="relative w-full h-full group">
          <video
            src={publicUrl}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Audio with thumbnail
    if (isAudioFile(file) && file.thumbnail_path) {
      const thumbnailUrl = getPublicUrl(file.thumbnail_path);
      return (
        <div className="relative w-full h-full group">
          <img
            src={thumbnailUrl}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <MusicIcon className="w-6 h-6 text-accent-orange" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Expand className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Audio without thumbnail
    if (isAudioFile(file)) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 group flex flex-col items-center justify-center p-4">
          <MusicIcon className="w-12 h-12 text-accent-orange mb-2" />
          <p className="text-xs font-medium text-center truncate w-full px-2">
            {file.title || file.filename}
          </p>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="relative w-full h-full bg-muted flex items-center justify-center">
        <FileText className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  };

  const renderModalContent = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file.file_path);

    if (file.file_type === 'image' || file.mime_type?.startsWith('image/')) {
      return (
        <img
          src={publicUrl}
          alt={file.title || file.filename}
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      );
    }

    if (isVideoFile(file)) {
      return (
        <video
          src={publicUrl}
          controls
          autoPlay
          className="w-full h-auto max-h-[80vh]"
        >
          <source src={publicUrl} type={file.mime_type || 'video/mp4'} />
        </video>
      );
    }

    if (isAudioFile(file)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-background to-muted min-h-[300px]">
          <MusicIcon className="w-16 h-16 text-accent-orange" />
          <p className="text-lg font-medium text-center">{file.title || file.filename}</p>
          <audio
            controls
            autoPlay
            className="w-full max-w-md"
            preload="metadata"
          >
            <source src={publicUrl} type={file.mime_type || 'audio/mpeg'} />
          </audio>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Fant ikke tilbudet</p>
          <Button onClick={() => navigate('/dashboard?section=admin-concepts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til Mine tilbud
          </Button>
        </div>
      </div>
    );
  }

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept.available_dates);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 via-accent-orange/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard?section=admin-concepts')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til Mine tilbud
          </Button>

          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold">{concept.title}</h1>
                  <Badge variant={concept.is_published ? 'default' : 'secondary'}>
                    {concept.is_published ? 'Publisert' : 'Utkast'}
                  </Badge>
                </div>
                {concept.description && (
                  <p className="text-lg text-muted-foreground">{concept.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border">
                  {concept.is_published ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={concept.is_published}
                    onCheckedChange={togglePublished}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
                <Button onClick={() => navigate(`/create-offer?edit=${concept.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger
                </Button>
              </div>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price */}
              <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Pris</span>
                </div>
                <p className="text-lg font-semibold">
                  {concept.door_deal && concept.door_percentage
                    ? `${concept.door_percentage}% av dørinntekter`
                    : concept.price_by_agreement
                    ? 'Ved avtale'
                    : concept.price
                    ? `${concept.price} Kr`
                    : 'Ikke spesifisert'}
                </p>
              </div>

              {/* Audience */}
              {concept.expected_audience && (
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Forventet publikum</span>
                  </div>
                  <p className="text-lg font-semibold">{concept.expected_audience} personer</p>
                </div>
              )}

              {/* Dates */}
              {(availableDates.length > 0 || isIndefinite) && (
                <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">Tilgjengelighet</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {isIndefinite
                      ? 'Ubestemt / Ved avtale'
                      : `${availableDates.length} dato${availableDates.length !== 1 ? 'er' : ''}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Dates Section */}
      {availableDates.length > 0 && !isIndefinite && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl">
            <h2 className="text-xl font-semibold mb-4">Tilgjengelige datoer</h2>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((date: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {format(new Date(date), 'dd.MM.yyyy')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Section */}
      {conceptFiles.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Portefølje</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {conceptFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-accent-orange transition-all"
                >
                  {renderFilePreview(file)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for expanded view */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          {selectedFile && renderModalContent(selectedFile)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
