import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileText, Image, Video, Music, Download, ChevronLeft, ChevronRight, X, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ConceptActionsDialog } from '@/components/ConceptActionsDialog';
import { useConceptActions } from '@/hooks/useConceptActions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConceptViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptIds: string[];
  initialConceptIndex?: number;
  showConceptActions?: boolean;
  onConceptAction?: (conceptId: string, action: 'rejected' | 'deleted') => void;
}

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
}

interface ConceptFile {
  id: string;
  filename: string;
  file_type: string;
  file_url: string;
  title?: string;
  created_at: string;
  mime_type?: string;
}

interface TechSpecFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
}

interface HospitalityRiderFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
}

export const ConceptViewModal = ({ 
  isOpen, 
  onClose, 
  conceptIds, 
  initialConceptIndex = 0,
  showConceptActions = false,
  onConceptAction
}: ConceptViewModalProps) => {
  const [currentConceptIndex, setCurrentConceptIndex] = useState(initialConceptIndex);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [conceptFiles, setConceptFiles] = useState<ConceptFile[]>([]);
  const [techSpecFile, setTechSpecFile] = useState<TechSpecFile | null>(null);
  const [hospitalityRiderFile, setHospitalityRiderFile] = useState<HospitalityRiderFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActionsDialog, setShowActionsDialog] = useState(false);
  
  const { toast } = useToast();
  const { rejectConcept, deleteConcept, loading: actionLoading } = useConceptActions();

  useEffect(() => {
    if (isOpen && conceptIds.length > 0) {
      loadConceptData(conceptIds[currentConceptIndex]);
    }
  }, [isOpen, currentConceptIndex, conceptIds]);

  const loadConceptData = async (conceptId: string) => {
    if (!conceptId) return;
    
    setLoading(true);
    try {
      // Load concept basic data
      const { data: conceptData, error: conceptError } = await supabase
        .from('concepts')
        .select('*')
        .eq('id', conceptId)
        .single();

      if (conceptError) throw conceptError;
      setConcept(conceptData);

      // Load concept files (portfolio)
      const { data: filesData, error: filesError } = await supabase
        .from('concept_files')
        .select('id, filename, file_type, file_url, title, created_at, mime_type')
        .eq('concept_id', conceptId);

      if (filesError) {
        console.error('Error loading concept files:', filesError);
      } else {
        setConceptFiles(filesData || []);
      }

      // Load tech spec file if reference exists
      if (conceptData.tech_spec_reference) {
        const { data: techSpecData, error: techSpecError } = await supabase
          .from('profile_tech_specs')
          .select('id, filename, file_url, file_type')
          .eq('id', conceptData.tech_spec_reference)
          .maybeSingle();

        if (techSpecError) {
          console.error('Error loading tech spec file:', techSpecError);
        } else {
          setTechSpecFile(techSpecData);
        }
      } else {
        setTechSpecFile(null);
      }

      // Load hospitality rider file if reference exists  
      if (conceptData.hospitality_rider_reference) {
        const { data: hospitalityRiderData, error: hospitalityRiderError } = await supabase
          .from('hospitality_riders')
          .select('id, filename, file_url, file_type')
          .eq('id', conceptData.hospitality_rider_reference)
          .maybeSingle();

        if (hospitalityRiderError) {
          console.error('Error loading hospitality rider file:', hospitalityRiderError);
        } else {
          setHospitalityRiderFile(hospitalityRiderData);
        }
      } else {
        setHospitalityRiderFile(null);
      }
    } catch (error: any) {
      console.error('Error loading concept data:', error);
      toast({
        title: "Feil ved lasting av konsept",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousConcept = () => {
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex(currentConceptIndex - 1);
    }
  };

  const handleNextConcept = () => {
    if (currentConceptIndex < conceptIds.length - 1) {
      setCurrentConceptIndex(currentConceptIndex + 1);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!concept) return;
    const result = await rejectConcept(concept.id, reason);
    if (result.success && onConceptAction) {
      onConceptAction(concept.id, 'rejected');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!concept) return;
    const result = await deleteConcept(concept.id);
    if (result.success && onConceptAction) {
      onConceptAction(concept.id, 'deleted');
      onClose();
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

  if (!concept && !loading) return null;

  const { dates: availableDates, isIndefinite } = parseAvailableDates(concept?.available_dates);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span>{concept?.title || 'Laster konsept...'}</span>
              {conceptIds.length > 1 && (
                <Badge variant="outline">
                  {currentConceptIndex + 1} av {conceptIds.length}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Navigation for multiple concepts */}
              {conceptIds.length > 1 && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousConcept}
                    disabled={currentConceptIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextConcept}
                    disabled={currentConceptIndex === conceptIds.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* Concept Actions */}
              {showConceptActions && concept && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={actionLoading}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowActionsDialog(true)}>
                      Konsepthandlinger
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Laster konsept...</span>
          </div>
        ) : concept ? (
          <div className="space-y-6">
            {/* Concept Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{concept.title}</CardTitle>
                    {concept.description && (
                      <p className="text-muted-foreground mt-2">{concept.description}</p>
                    )}
                  </div>
                  <Badge variant={concept.is_published ? "default" : "secondary"}>
                    {concept.is_published ? 'Publisert' : 'Utkast'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                {(availableDates.length > 0 || isIndefinite) && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Tilgjengelige datoer
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {isIndefinite ? (
                        <Badge variant="outline">
                          Ubestemt / Ved avtale
                        </Badge>
                      ) : (
                        Array.isArray(availableDates) ? availableDates.filter(date => date).map((date: string, index: number) => (
                          <Badge key={date || `date-${index}`} variant="outline">
                            {format(new Date(date), 'dd.MM.yyyy')}
                          </Badge>
                        )) : <></>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Concept Portfolio Files */}
            {conceptFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Konsept portefølje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(conceptFiles) ? conceptFiles.filter(file => file && file.id).map((file) => (
                      <div key={file.id} className="bg-muted/30 rounded-lg overflow-hidden">
                        
                        {/* Video Display */}
                        {(file.file_type === 'video' || file.mime_type?.startsWith('video/') || 
                         file.filename.match(/\.(mp4|webm|mov|avi)$/i)) && (
                          <div className="aspect-video bg-black">
                            <video 
                              controls 
                              className="w-full h-full"
                              preload="metadata"
                              crossOrigin="anonymous"
                            >
                              <source src={file.file_url} type={file.mime_type || 'video/mp4'} />
                              <source src={file.file_url} type="video/mp4" />
                              Din nettleser støtter ikke video-avspilling.
                            </video>
                          </div>
                        )}
                        
                        {/* Image Display */}
                        {(file.file_type === 'image' || file.mime_type?.startsWith('image/') || 
                         file.filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) && (
                           <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                             <img 
                               src={file.file_url} 
                               alt={file.title || file.filename}
                               className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                               crossOrigin="anonymous"
                               onClick={() => window.open(file.file_url, '_blank')}
                             />
                           </div>
                         )}
                        
                        {/* Audio Display */}
                        {(file.file_type === 'audio' || file.mime_type?.startsWith('audio/') || 
                         file.filename.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) && (
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Music className="h-5 w-5 text-primary" />
                              <span className="font-medium text-sm">Lydfil</span>
                            </div>
                            <audio 
                              controls 
                              className="w-full"
                              preload="metadata"
                              crossOrigin="anonymous"
                            >
                              <source src={file.file_url} type={file.mime_type || 'audio/mpeg'} />
                              Din nettleser støtter ikke lyd-avspilling.
                            </audio>
                          </div>
                        )}
                        
                        {/* Document Display */}
                        {(file.file_type === 'document' || 
                         file.mime_type?.includes('pdf') || 
                         file.mime_type?.includes('document') || 
                         file.mime_type?.includes('text') || 
                         file.mime_type?.includes('application/') || 
                         file.filename.match(/\.(pdf|doc|docx|txt)$/i)) && 
                         file.file_type !== 'image' && file.file_type !== 'video' && file.file_type !== 'audio' && (
                           <div className="aspect-video bg-muted flex flex-col items-center justify-center p-4">
                             <FileText className="h-12 w-12 text-primary mb-2" />
                             <span className="text-sm font-medium text-center mb-2">{file.filename}</span>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => window.open(file.file_url, '_blank')}
                             >
                               <Download className="h-3 w-3 mr-1" />
                               Last ned
                             </Button>
                           </div>
                         )}
                        
                        {/* File Info */}
                        <div className="p-3 border-t">
                          <h5 className="font-medium text-sm truncate">
                            {file.title || file.filename}
                          </h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.file_type} • {format(new Date(file.created_at), 'dd.MM.yy')}
                          </p>
                        </div>
                      </div>
                    )) : <></>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tech Spec and Hospitality Rider Files */}
            {(techSpecFile || hospitalityRiderFile) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Vedlegg
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {techSpecFile && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h5 className="font-medium text-sm">{techSpecFile.filename}</h5>
                            <p className="text-xs text-muted-foreground">Teknisk spesifikasjon</p>
                          </div>
                        </div>
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(techSpecFile.file_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Last ned
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {hospitalityRiderFile && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h5 className="font-medium text-sm">{hospitalityRiderFile.filename}</h5>
                            <p className="text-xs text-muted-foreground">Hospitality Rider</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm" 
                          onClick={() => window.open(hospitalityRiderFile.file_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Last ned
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Created date */}
            <div className="text-xs text-muted-foreground pt-2 border-t text-center">
              Konsept opprettet: {format(new Date(concept.created_at), 'dd.MM.yyyy HH:mm')}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Konsept ikke funnet
          </div>
        )}
      </DialogContent>
      
      {/* Concept Actions Dialog */}
      {showConceptActions && concept && (
        <ConceptActionsDialog
          isOpen={showActionsDialog}
          onClose={() => setShowActionsDialog(false)}
          onReject={handleReject}
          onDelete={handleDelete}
          conceptTitle={concept.title}
          isLoading={actionLoading}
        />
      )}
    </Dialog>
  );
};