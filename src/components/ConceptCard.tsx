import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileText, Image, Video, Music, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ConceptCardProps {
  concept: {
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
  };
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  title?: string;
  created_at: string;
}

interface TechSpecFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
}

const ConceptCard = ({ concept, showActions = false, onEdit, onDelete }: ConceptCardProps) => {
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
  const [techSpecFile, setTechSpecFile] = useState<TechSpecFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConceptData();
  }, [concept.id]);

  const loadConceptData = async () => {
    try {
      // Load concept files (portfolio)
      const { data: filesData, error: filesError } = await supabase
        .from('concept_files')
        .select('id, filename, file_type, file_url, title, created_at')
        .eq('concept_id', concept.id);

      if (filesError) {
        console.error('Error loading concept files:', filesError);
      } else {
        setConceptFiles(filesData || []);
      }

      // Load tech spec file if reference exists
      if (concept.tech_spec_reference) {
        const { data: techSpecData, error: techSpecError } = await supabase
          .from('profile_tech_specs')
          .select('id, filename, file_url, file_type')
          .eq('id', concept.tech_spec_reference)
          .maybeSingle();

        if (techSpecError) {
          console.error('Error loading tech spec file:', techSpecError);
        } else {
          setTechSpecFile(techSpecData);
        }
      }
    } catch (error) {
      console.error('Error loading concept data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-4 w-4" />;
    if (fileType.includes('video')) return <Video className="h-4 w-4" />;
    if (fileType.includes('audio')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const parseAvailableDates = (datesData: any) => {
    if (!datesData) return [];
    try {
      const dates = typeof datesData === 'string' ? JSON.parse(datesData) : datesData;
      return Array.isArray(dates) ? dates : [];
    } catch {
      return [];
    }
  };

  const availableDates = parseAvailableDates(concept.available_dates);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{concept.title}</CardTitle>
              <Badge variant={concept.is_published ? "default" : "secondary"}>
                {concept.is_published ? 'Publisert' : 'Utkast'}
              </Badge>
            </div>
            {concept.description && (
              <p className="text-muted-foreground">{concept.description}</p>
            )}
          </div>
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Rediger
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Slett
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {concept.price && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Pris:</span>
              <span>{concept.price} NOK</span>
            </div>
          )}
          {concept.expected_audience && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Publikum:</span>
              <span>{concept.expected_audience} personer</span>
            </div>
          )}
        </div>

        {/* Available Dates */}
        {availableDates.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Tilgjengelige datoer
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((date: string, index: number) => (
                <Badge key={index} variant="outline">
                  {format(new Date(date), 'dd.MM.yyyy')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Concept Portfolio Files - Interactive Media Display */}
        {conceptFiles.length > 0 && (
          <div>
            <h4 className="font-medium mb-4">Konsept portefølje</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conceptFiles.map((file) => (
                <div key={file.id} className="bg-muted/30 rounded-lg overflow-hidden">
                  {/* Image Display */}
                  {file.file_type.startsWith('image/') && (
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={file.file_url} 
                        alt={file.title || file.filename}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(file.file_url, '_blank')}
                      />
                    </div>
                  )}
                  
                  {/* Video Display */}
                  {file.file_type.startsWith('video/') && (
                    <div className="aspect-video bg-black">
                      <video 
                        controls 
                        className="w-full h-full"
                        preload="metadata"
                      >
                        <source src={file.file_url} type={file.file_type} />
                        Din nettleser støtter ikke video-avspilling.
                      </video>
                    </div>
                  )}
                  
                  {/* Audio Display */}
                  {file.file_type.startsWith('audio/') && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Music className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">Lydfil</span>
                      </div>
                      <audio 
                        controls 
                        className="w-full"
                        preload="metadata"
                      >
                        <source src={file.file_url} type={file.file_type} />
                        Din nettleser støtter ikke lyd-avspilling.
                      </audio>
                    </div>
                  )}
                  
                  {/* Document Display */}
                  {(file.file_type.includes('pdf') || file.file_type.includes('document') || file.file_type.includes('text')) && (
                    <div className="aspect-video bg-muted flex flex-col items-center justify-center p-4">
                      <FileText className="h-12 w-12 text-primary mb-2" />
                      <span className="text-sm font-medium text-center">Dokument</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Åpne
                      </Button>
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="p-3 border-t">
                    <h5 className="font-medium text-sm truncate">
                      {file.title || file.filename}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.file_type.split('/')[0]} • {format(new Date(file.created_at), 'dd.MM.yy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Spec - Hidden from UI as per requirements */}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-pulse">Laster konseptdetaljer...</div>
          </div>
        )}

        {/* Empty states */}
        {!loading && conceptFiles.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Ingen porteføljefiler for dette konseptet
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Opprettet: {format(new Date(concept.created_at), 'dd.MM.yyyy HH:mm')}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConceptCard;