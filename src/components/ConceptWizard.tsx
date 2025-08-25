import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, ChevronLeft, ChevronRight, Eye, Save, X, Video, Music, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConceptPortfolioUpload from '@/components/ConceptPortfolioUpload';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';

interface ConceptData {
  title: string;
  description: string;
  price: string;
  expected_audience: string;
  tech_spec: string;
  available_dates: Date[];
  portfolio_files: any[];
  selected_tech_spec_file: string;
  selected_hospitality_rider_file: string;
  is_indefinite: boolean;
}

interface ConceptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const STEPS = [
  { id: 'basic', title: 'Grunnleggende info', description: 'Tittel og beskrivelse' },
  { id: 'details', title: 'Detaljer', description: 'Pris og publikum' },
  { id: 'portfolio', title: 'Portefølje', description: 'Last opp mediefiler' },
  { id: 'technical', title: 'Tekniske krav', description: 'Velg teknisk spesifikasjon' },
  { id: 'dates', title: 'Tilgjengelighet', description: 'Velg tilgjengelige datoer' },
  { id: 'preview', title: 'Forhåndsvisning', description: 'Se over og lagre' },
];

export const ConceptWizard = ({ isOpen, onClose, onSuccess, userId }: ConceptWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveAsPublished, setSaveAsPublished] = useState(false);
  const { files: availableTechSpecs, loading: techSpecsLoading } = useProfileTechSpecs(userId);
  const { files: availableHospitalityRiders, loading: hospitalityRidersLoading } = useHospitalityRiders(userId);
  const { toast } = useToast();

  const [conceptData, setConceptData] = useState<ConceptData>(() => ({
    title: '',
    description: '',
    price: '',
    expected_audience: '',
    tech_spec: '',
    available_dates: [],
    portfolio_files: [],
    selected_tech_spec_file: '',
    selected_hospitality_rider_file: '',
    is_indefinite: false,
  }));

  const updateConceptData = (field: keyof ConceptData, value: any) => {
    setConceptData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploaded = (fileData: any) => {
    // Add comprehensive validation
    if (!fileData || !fileData.filename || !fileData.file_path) {
      toast({
        title: "Feil",
        description: "Ugyldig fildata mottatt",
        variant: "destructive",
      });
      return;
    }

    // Store the file data with enhanced properties
    setConceptData(prev => ({
      ...prev,
      portfolio_files: [...prev.portfolio_files, {
        ...fileData,
        tempId: Date.now() + Math.random(), // Add a temporary ID for UI purposes
        title: fileData.title || fileData.filename,
        uploadedAt: new Date().toISOString()
      }]
    }));
  };

  const removePortfolioFile = async (fileData: any) => {
    // Remove from storage if it was uploaded
    if (fileData.file_path) {
      try {
        await supabase.storage
          .from('concepts')
          .remove([fileData.file_path]);
      } catch (error) {
        console.error('Error removing file from storage:', error);
      }
    }
    
    // Remove from state
    setConceptData(prev => ({
      ...prev,
      portfolio_files: prev.portfolio_files.filter(file => 
        file.tempId !== fileData.tempId && 
        file.id !== fileData.id && 
        file.filename !== fileData.filename
      )
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async (isPublished = false) => {
    setSaving(true);
    try {
      const conceptPayload = {
        maker_id: userId,
        title: conceptData.title,
        description: conceptData.description || null,
        price: conceptData.price ? parseFloat(conceptData.price) : null,
        expected_audience: conceptData.expected_audience ? parseInt(conceptData.expected_audience) : null,
        tech_spec: conceptData.tech_spec || null,
        tech_spec_reference: conceptData.selected_tech_spec_file || null,
        hospitality_rider_reference: conceptData.selected_hospitality_rider_file || null,
        available_dates: conceptData.is_indefinite 
          ? JSON.stringify({ indefinite: true })
          : (conceptData.available_dates.length > 0 ? JSON.stringify(conceptData.available_dates) : null),
        is_published: isPublished,
        status: isPublished ? 'published' : 'draft'
      };

      const { data, error: insertError } = await supabase
        .from('concepts')
        .insert(conceptPayload)
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      const conceptId = data?.id;

      // Create concept_files records for uploaded files
      if (conceptData.portfolio_files.length > 0 && conceptId) {
        // First, ensure we have the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Authentication required to save files');
        }

        const fileRecords = Array.isArray(conceptData.portfolio_files) 
          ? conceptData.portfolio_files.filter(file => file && file.filename).map(file => ({
          creator_id: user.id,
          concept_id: conceptId,
          filename: file.filename,
          file_path: file.file_path,
          file_type: file.file_type,
          file_url: file.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${file.file_path}`,
          mime_type: file.mime_type,
          file_size: file.file_size,
          title: file.title || file.filename,
          is_public: true
        }))
          : [];

        const { error: filesError } = await supabase
          .from('concept_files')
          .insert(fileRecords);
        
        if (filesError) {
          console.error('Error creating concept files:', filesError);
          // Don't throw here - concept was created successfully, just log the file error
          toast({
            title: "Advarsel",
            description: "Konsept lagret, men noen filer kunne ikke lagres. Prøv å laste dem opp på nytt.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: isPublished ? "Konsept publisert!" : "Konsept lagret!",
        description: isPublished ? "Konseptet er nå tilgjengelig for andre" : "Konseptet er lagret som utkast",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message || "En ukjent feil oppstod",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: 
        return conceptData.title.trim().length > 0;
      case 1: 
        return conceptData.price.length > 0 && 
               conceptData.expected_audience.length > 0 &&
               parseFloat(conceptData.price) > 0 &&
               parseInt(conceptData.expected_audience) > 0;
      case 2: 
        return true; // Portfolio is optional
      case 3: 
        return true; // Tech spec is optional
      case 4: 
        return conceptData.available_dates.length > 0 || conceptData.is_indefinite;
      case 5: 
        return true; // Preview step
      default: 
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>
              Opprett nytt konsept
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep].title} - {STEPS[currentStep].description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Progress indicator */}
          <div className="flex justify-between items-center">
            {Array.isArray(STEPS) ? STEPS.map((step, index) => (
              <div key={step.id || `step-${index}`} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            )) : <></>}
          </div>

          <Separator />

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Konsepttittel *</Label>
                <Input
                  id="title"
                  placeholder="F.eks. Live akustisk konsert"
                  value={conceptData.title}
                  onChange={(e) => updateConceptData('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Beskriv konseptet ditt i detalj..."
                  value={conceptData.description}
                  onChange={(e) => updateConceptData('description', e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Pris (NOK) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="F.eks. 5000"
                  value={conceptData.price}
                  onChange={(e) => updateConceptData('price', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="audience">Forventet publikum (antall) *</Label>
                <Input
                  id="audience"
                  type="number"
                  placeholder="F.eks. 50"
                  value={conceptData.expected_audience}
                  onChange={(e) => updateConceptData('expected_audience', e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <ConceptPortfolioUpload
              userId={userId}
              files={conceptData.portfolio_files}
              onFileUploaded={handleFileUploaded}
              onFileRemoved={removePortfolioFile}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="techspec">Teknisk spesifikasjon</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Velg en teknisk spesifikasjon fra din profil
                </p>
                <Select
                  value={conceptData.selected_tech_spec_file}
                  onValueChange={(value) => updateConceptData('selected_tech_spec_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg teknisk spesifikasjon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {techSpecsLoading ? (
                      <SelectItem value="loading" disabled>
                        Laster...
                      </SelectItem>
                    ) : availableTechSpecs.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Ingen tech spec filer funnet
                      </SelectItem>
                     ) : (
                       Array.isArray(availableTechSpecs) ? availableTechSpecs.filter(file => file && file.id).map((file) => (
                         <SelectItem key={file.id} value={file.id}>
                           {file.filename || 'Unnamed file'}
                         </SelectItem>
                       )) : <></>
                     )}
                  </SelectContent>
                </Select>
                {availableTechSpecs.length === 0 && !techSpecsLoading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last opp tech spec dokumenter i din profil for å velge dem her
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="hospitalityrider">Hospitality Rider</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Velg en hospitality rider fra din profil
                </p>
                <Select
                  value={conceptData.selected_hospitality_rider_file}
                  onValueChange={(value) => updateConceptData('selected_hospitality_rider_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg hospitality rider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalityRidersLoading ? (
                      <SelectItem value="loading" disabled>
                        Laster...
                      </SelectItem>
                    ) : availableHospitalityRiders.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Ingen hospitality rider filer funnet
                      </SelectItem>
                     ) : (
                       Array.isArray(availableHospitalityRiders) ? availableHospitalityRiders.filter(file => file && file.id).map((file) => (
                         <SelectItem key={file.id} value={file.id}>
                           {file.filename || 'Unnamed file'}
                         </SelectItem>
                       )) : <></>
                     )}
                  </SelectContent>
                </Select>
                {availableHospitalityRiders.length === 0 && !hospitalityRidersLoading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last opp hospitality rider dokumenter i din profil for å velge dem her
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label>Tilgjengelige datoer *</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg enten spesifikke datoer eller "Ubestemt / Ved avtale"
                </p>
                
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="indefinite-mode"
                    checked={conceptData.is_indefinite}
                    onCheckedChange={(checked) => {
                      updateConceptData('is_indefinite', checked);
                      if (checked) {
                        updateConceptData('available_dates', []);
                      }
                    }}
                  />
                  <Label htmlFor="indefinite-mode">
                    Ubestemt / Ved avtale
                  </Label>
                </div>

                {conceptData.is_indefinite ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Tilgjengelighet avtales direkte med interesserte parter
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.isArray(conceptData.available_dates) ? conceptData.available_dates.filter(date => date).map((date, index) => (
                        <div key={date.toISOString() || `date-${index}`} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                          {format(date, 'dd.MM.yyyy')}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-primary"
                            onClick={() => {
                              const newDates = conceptData.available_dates.filter((_, i) => i !== index);
                              updateConceptData('available_dates', newDates);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )) : <></>}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-[240px] justify-start text-left font-normal"
                          disabled={conceptData.is_indefinite}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Legg til dato
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          onSelect={(date) => {
                            if (date && !conceptData.available_dates.find(d => d.getTime() === date.getTime())) {
                              updateConceptData('available_dates', [...conceptData.available_dates, date]);
                            }
                          }}
                          disabled={(date) => date < new Date() || conceptData.available_dates.some(d => d.getTime() === date.getTime())}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold">{conceptData.title}</h3>
                {conceptData.description && (
                  <p className="text-muted-foreground">{conceptData.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Pris:</strong> {conceptData.price} NOK
                  </div>
                  <div>
                    <strong>Forventet publikum:</strong> {conceptData.expected_audience} personer
                  </div>
                </div>

                {conceptData.portfolio_files.length > 0 && (
                  <div>
                    <strong>Portefølje filer:</strong>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {Array.isArray(conceptData.portfolio_files) ? conceptData.portfolio_files.filter(file => file && (file.tempId || file.id || file.filename)).map((file, index) => (
                          <div key={file.tempId || file.id || file.filename || `file-${index}`} className="bg-muted/30 rounded-lg overflow-hidden">
                            {/* Image Thumbnail */}
                            {file.file_type?.startsWith('image/') && (
                              <div className="aspect-video bg-muted overflow-hidden">
                                <img 
                                  src={file.publicUrl} 
                                  alt={file.filename}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Video Thumbnail */}
                            {file.file_type?.startsWith('video/') && (
                              <div className="aspect-video bg-black flex items-center justify-center">
                                <Video className="h-8 w-8 text-white" />
                              </div>
                            )}
                            
                            {/* Audio Icon */}
                            {file.file_type?.startsWith('audio/') && (
                              <div className="aspect-video bg-primary/10 flex items-center justify-center">
                                <Music className="h-8 w-8 text-primary" />
                              </div>
                            )}
                            
                            {/* Document Icon */}
                            {(file.file_type?.includes('pdf') || file.file_type?.includes('document') || file.file_type?.includes('text')) && (
                              <div className="aspect-video bg-muted flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{file.filename}</p>
                              <p className="text-xs text-muted-foreground">{file.file_type?.split('/')[0] || 'fil'}</p>
                            </div>
                          </div>
                        )) : <></>}
                      </div>
                  </div>
                )}

                {/* Tech Spec Reference - Hidden from Preview as per requirements */}

                <div>
                  <strong>Tilgjengelige datoer:</strong>
                  {conceptData.is_indefinite ? (
                    <div className="mt-2">
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm">
                        Ubestemt / Ved avtale
                      </span>
                    </div>
                  ) : conceptData.available_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(conceptData.available_dates) ? conceptData.available_dates.filter(date => date).map((date, index) => (
                        <span key={date.toISOString() || `date-${index}`} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {format(date, 'dd.MM.yyyy')}
                        </span>
                      )) : <></>}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Ingen datoer valgt</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setSaveAsPublished(false);
                    setShowConfirmDialog(true);
                  }}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre som utkast
                </Button>
                <Button
                  onClick={() => {
                    setSaveAsPublished(true);
                    setShowConfirmDialog(true);
                  }}
                  disabled={saving}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Publiser konsept
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
              <AlertDialogDescription>
                Når konseptet er opprettet vil det ikke kunne redigeres. Er du sikker på at du vil fortsette?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleSave(saveAsPublished);
                }}
                disabled={saving}
              >
                {saveAsPublished ? 'Publiser konsept' : 'Lagre konsept'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center p-6 pt-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Forrige
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Neste
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};