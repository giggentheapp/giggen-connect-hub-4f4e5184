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
  file_name: string;
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
          .select('id, file_name, file_url, file_type')
          .eq('id', concept.tech_spec_reference)
          .single();

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

        {/* Concept Portfolio Files */}
        {conceptFiles.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Konsept portefølje</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {conceptFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  {getFileIcon(file.file_type)}
                  <span className="text-sm truncate flex-1">
                    {file.title || file.filename}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Spec */}
        {techSpecFile && (
          <div>
            <h4 className="font-medium mb-2">Teknisk spesifikasjon</h4>
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm flex-1">{techSpecFile.file_name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(techSpecFile.file_url, '_blank')}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-pulse">Laster konseptdetaljer...</div>
          </div>
        )}

        {/* Empty states */}
        {!loading && conceptFiles.length === 0 && !techSpecFile && (
          <div className="text-center py-4 text-muted-foreground">
            Ingen tilleggsfiler for dette konseptet
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