import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, File, Image as ImageIcon, Video, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_path: string;
  file_url?: string;
  title?: string;
  mime_type?: string;
}

const ProfileConceptView = () => {
  const { userId, conceptId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [concept, setConcept] = useState<any>(null);
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
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

        // Load concept files
        const { data: filesData, error: filesError } = await supabase
          .from('concept_files')
          .select('*')
          .eq('concept_id', conceptId);

        if (filesError) {
          console.error('Error loading concept files:', filesError);
        } else {
          setConceptFiles(filesData || []);
        }
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

  const getPublicUrl = (file: ConceptFile) => {
    // Use file_url if available, otherwise construct URL from file_path
    if (file.file_url) {
      return file.file_url;
    }
    return `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const renderMedia = (file: ConceptFile) => {
    const publicUrl = getPublicUrl(file);
    
    if (file.file_type === 'image') {
      return (
        <img 
          src={publicUrl} 
          alt={file.title || file.filename} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    } else if (file.file_type === 'video') {
      return (
        <video 
          src={publicUrl} 
          className="w-full h-full object-cover" 
          controls
        />
      );
    } else if (file.file_type === 'audio') {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <audio src={publicUrl} controls className="w-full max-w-md" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <File className="h-12 w-12 text-muted-foreground" />
      </div>
    );
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
      <div className="container mx-auto p-3 md:p-6 max-w-4xl">
        <div className="space-y-3 md:space-y-4">
          {/* Main concept info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Title */}
              <div>
                <h1 className="text-lg sm:text-xl font-bold mb-1">{concept.title}</h1>
                {concept.description && (
                  <p className="text-muted-foreground text-sm">{concept.description}</p>
                )}
              </div>

              {/* Pricing info */}
              <div className="flex flex-wrap gap-2">
                {concept.price && !concept.door_deal && !concept.price_by_agreement && (
                  <Badge variant="outline" className="text-xs">
                    {concept.price} kr
                  </Badge>
                )}
                {concept.door_deal && concept.door_percentage && (
                  <Badge variant="outline" className="text-xs">
                    {concept.door_percentage}% av dørinntekter
                  </Badge>
                )}
                {concept.price_by_agreement && (
                  <Badge variant="outline" className="text-xs">
                    Pris ved avtale
                  </Badge>
                )}
                {concept.expected_audience && (
                  <Badge variant="secondary" className="text-xs">
                    {concept.expected_audience} publikum
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio files */}
          {conceptFiles.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <File className="h-4 w-4" />
                  Portefølje ({conceptFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {conceptFiles.map(file => (
                    <div 
                      key={file.id}
                      className="rounded-lg border bg-muted/30 overflow-hidden"
                    >
                      {/* File header */}
                      <div className="p-3 border-b bg-card">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.file_type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {file.title || file.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.file_type.charAt(0).toUpperCase() + file.file_type.slice(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Media content */}
                      <div className="bg-black/5">
                        {file.file_type === 'image' && (
                          <img 
                            src={getPublicUrl(file)} 
                            alt={file.title || file.filename}
                            className="w-full max-h-[400px] object-contain"
                            loading="lazy"
                          />
                        )}
                        
                        {file.file_type === 'video' && (
                          <video 
                            src={getPublicUrl(file)}
                            controls
                            className="w-full max-h-[400px]"
                            preload="metadata"
                            crossOrigin="anonymous"
                          >
                            <source src={getPublicUrl(file)} type={file.mime_type || 'video/mp4'} />
                            Din nettleser støtter ikke video.
                          </video>
                        )}
                        
                        {file.file_type === 'audio' && (
                          <div className="p-4">
                            <audio 
                              src={getPublicUrl(file)}
                              controls
                              className="w-full"
                              preload="metadata"
                              crossOrigin="anonymous"
                            >
                              Din nettleser støtter ikke lyd.
                            </audio>
                          </div>
                        )}
                        
                        {!['image', 'video', 'audio'].includes(file.file_type) && (
                          <div className="flex items-center justify-center p-8 text-muted-foreground">
                            <File className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileConceptView;
