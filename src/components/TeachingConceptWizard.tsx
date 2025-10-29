import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Plus, X, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';

interface TeachingField {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
  enabled: boolean;
}

interface TeachingSectionData {
  [key: string]: TeachingField[];
}

interface TeachingConceptWizardProps {
  userId: string;
  onSuccess: () => void;
  onBack: () => void;
}

const STEPS = [
  { id: 'intro', title: 'Introduksjon', description: 'Hva er dette?' },
  { id: 'basic', title: 'Grunnleggende', description: 'Tittel og beskrivelse' },
  { id: 'portfolio', title: 'Portfolio', description: 'Last opp filer' },
  { id: 'schedule', title: 'Undervisningstider', description: 'Lokasjon og tidspunkt' },
  { id: 'payment', title: 'Betaling', description: 'Betalingsbetingelser' },
  { id: 'responsibilities', title: 'Ansvar', description: 'Elevens ansvar og forventninger' },
  { id: 'focus', title: 'Fokus', description: 'Innhold og tema' },
  { id: 'termination', title: 'Avslutning', description: 'Oppsigelse og varsel' },
  { id: 'liability', title: 'Forsikring', description: 'Ansvar og forsikring' },
  { id: 'communication', title: 'Kommunikasjon', description: 'Avlysning og kommunikasjon' },
  { id: 'preview', title: 'Forhåndsvisning', description: 'Gjennomgå og publiser' },
];

const DEFAULT_SECTIONS: TeachingSectionData = {
  schedule: [
    { id: 'location', label: 'Lokasjon for undervisning', value: '', enabled: true },
    { id: 'day_time', label: 'Dag og tid', value: '', enabled: true },
    { id: 'lesson_length', label: 'Lengde på hver time', value: '60', enabled: true },
    { id: 'frequency', label: 'Hyppighet (ukentlig, annenhver uke)', value: 'Ukentlig', enabled: true },
  ],
  payment: [
    { id: 'hourly_rate', label: 'Timesats', value: '', enabled: true },
    { id: 'monthly_price', label: 'Månedspris', value: '', enabled: true },
    { id: 'payment_method', label: 'Betalingsmetode (Vipps, Bankoverføring)', value: '', enabled: true },
    { id: 'payment_due', label: 'Når betaling skal skje', value: '', enabled: true },
    { id: 'discounts', label: 'Rabatter for forskuddsbetaling', value: '', enabled: true },
  ],
  responsibilities: [
    { id: 'own_instrument', label: 'Elev må ha sitt eget instrument', value: 'Ja', enabled: true },
    { id: 'practice_expectation', label: 'Forventning om praksis mellom timene', value: '', enabled: true },
    { id: 'respect', label: 'Respekt for instruktørens tid og sted', value: 'Ja', enabled: true },
  ],
  focus: [
    { id: 'technique', label: 'Teknikk', value: '', enabled: true },
    { id: 'repertoire', label: 'Sangbok/repertoar', value: '', enabled: true },
    { id: 'ear_training', label: 'Gehørtrening', value: '', enabled: true },
    { id: 'other_focus', label: 'Annet', value: '', enabled: false },
  ],
  termination: [
    { id: 'notice_period', label: 'Oppsigningsfrist (uker)', value: '4', enabled: true },
    { id: 'termination_procedure', label: 'Prosedyre for oppsigelse', value: '', enabled: true },
  ],
  liability: [
    { id: 'instrument_liability', label: 'Instruktør ikke ansvarlig for elevens instrument', value: 'Ja', enabled: true },
    { id: 'student_insurance', label: 'Elev ansvarlig for egen forsikring', value: 'Ja', enabled: true },
  ],
  communication: [
    { id: 'cancellation_notice', label: 'Timefrist for avlysning (timer)', value: '24', enabled: true },
    { id: 'cancellation_method', label: 'Hvordan avlysninger skal meddeles', value: '', enabled: true },
    { id: 'illness_rules', label: 'Regler for sykdom', value: '', enabled: true },
  ],
};

export const TeachingConceptWizard = ({ userId, onSuccess, onBack }: TeachingConceptWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const { toast } = useToast();

  const [basicData, setBasicData] = useState({
    title: '',
    description: '',
  });

  const [portfolioFiles, setPortfolioFiles] = useState<any[]>([]);
  const [sections, setSections] = useState<TeachingSectionData>(DEFAULT_SECTIONS);

  const handleFileSelected = (file: any) => {
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`;
    
    setPortfolioFiles(prev => [...prev, {
      filebankId: file.id,
      filename: file.filename,
      file_path: file.file_path,
      file_type: file.file_type,
      mime_type: file.mime_type,
      file_size: file.file_size,
      publicUrl: publicUrl,
      file_url: publicUrl,
      title: file.filename,
      thumbnail_path: file.thumbnail_path,
      uploadedAt: file.created_at,
      fromFilbank: true
    }]);
    
    toast({
      title: 'Fil lagt til',
      description: `${file.filename} er lagt til i portfolio`,
    });
  };

  const removePortfolioFile = (fileId: string) => {
    setPortfolioFiles(prev => prev.filter(f => f.filebankId !== fileId));
    toast({
      title: 'Fil fjernet',
      description: 'Filen er fjernet fra portfolio',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio')) return '🎵';
    return '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const addCustomField = (sectionKey: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: [
        ...prev[sectionKey],
        {
          id: `custom_${Date.now()}`,
          label: '',
          value: '',
          isCustom: true,
          enabled: true,
        }
      ]
    }));
  };

  const removeCustomField = (sectionKey: string, fieldId: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter(f => f.id !== fieldId)
    }));
  };

  const updateField = (sectionKey: string, fieldId: string, updates: Partial<TeachingField>) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    }));
  };

  const handleSave = async (isPublished = false) => {
    if (!basicData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('concepts')
        .insert({
          maker_id: userId,
          title: basicData.title,
          description: basicData.description || null,
          concept_type: 'teaching',
          teaching_data: sections as any,
          is_published: isPublished,
          status: isPublished ? 'published' : 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: isPublished ? 'Publisert' : 'Utkast lagret',
        description: isPublished ? 'Undervisningsavtalen er publisert' : 'Dine endringer er lagret',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Kunne ikke lagre',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

  const renderSectionFields = (sectionKey: string) => {
    const fields = sections[sectionKey] || [];
    
    return (
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={field.enabled}
              onCheckedChange={(checked) => 
                updateField(sectionKey, field.id, { enabled: checked as boolean })
              }
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              {field.isCustom ? (
                <Input
                  placeholder="Feltnavn"
                  value={field.label}
                  onChange={(e) => updateField(sectionKey, field.id, { label: e.target.value })}
                  className="font-medium"
                />
              ) : (
                <Label className="font-medium">{field.label}</Label>
              )}
              
              {field.enabled && (
                field.id === 'lesson_length' ? (
                  <Select
                    value={field.value}
                    onValueChange={(value) => updateField(sectionKey, field.id, { value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutter</SelectItem>
                      <SelectItem value="45">45 minutter</SelectItem>
                      <SelectItem value="60">60 minutter</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Fyll inn..."
                    value={field.value}
                    onChange={(e) => updateField(sectionKey, field.id, { value: e.target.value })}
                  />
                )
              )}
            </div>
            {field.isCustom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCustomField(sectionKey, field.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={() => addCustomField(sectionKey)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til eget felt
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Opprett Undervisningsavtale</CardTitle>
        <CardDescription>
          {STEPS[currentStep].title} - {STEPS[currentStep].description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-between items-center overflow-x-auto pb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                  index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-semibold mb-3">Velkommen til undervisningsavtale</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dette verktøyet hjelper deg med å lage en profesjonell undervisningsavtale på få minutter.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tittel og beskrivelse</p>
                    <p className="text-xs text-muted-foreground">Gi avtalen en tittel</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Portfolio</p>
                    <p className="text-xs text-muted-foreground">Legg ved relevante filer (2 min)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Velg relevante punkter</p>
                    <p className="text-xs text-muted-foreground">Kryss av for punkter du vil inkludere (5-8 min)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Gjennomgå og publiser</p>
                    <p className="text-xs text-muted-foreground">Se over avtalen før publisering (1 min)</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  ⏱️ <strong>Total tid:</strong> Ca. 10-15 minutter
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tittel på avtalen</Label>
              <Input
                id="title"
                placeholder="F.eks. 'Bassundervisning med John Doe'"
                value={basicData.title}
                onChange={(e) => setBasicData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
              <Textarea
                id="description"
                placeholder="Beskriv undervisningstilbudet..."
                value={basicData.description}
                onChange={(e) => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Legg ved relevante filer som kan hjelpe eleven å forstå hva du tilbyr (presentasjoner, videoer, tidligere elevarbeider osv.)
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilebankModal(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til filer fra filbank
            </Button>
            
            {portfolioFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Vedlagte filer ({portfolioFiles.length})</Label>
                <div className="space-y-2">
                  {portfolioFiles.map((file) => (
                    <div
                      key={file.filebankId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.file_type} • {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePortfolioFile(file.filebankId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && renderSectionFields('schedule')}
        {currentStep === 4 && renderSectionFields('payment')}
        {currentStep === 5 && renderSectionFields('responsibilities')}
        {currentStep === 6 && renderSectionFields('focus')}
        {currentStep === 7 && renderSectionFields('termination')}
        {currentStep === 8 && renderSectionFields('liability')}
        {currentStep === 9 && renderSectionFields('communication')}

        {currentStep === 10 && (
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">{basicData.title}</h3>
              {basicData.description && (
                <p className="text-sm text-muted-foreground mb-4">{basicData.description}</p>
              )}
              
              {Object.entries(sections).map(([key, fields]) => {
                const enabledFields = fields.filter(f => f.enabled && f.value);
                if (enabledFields.length === 0) return null;
                
                const sectionTitle = STEPS.find(s => s.id === key)?.title || key;
                
                return (
                  <div key={key} className="mb-4">
                    <h4 className="font-medium mb-2">{sectionTitle}</h4>
                    <ul className="text-sm space-y-1 ml-4">
                      {enabledFields.map(field => (
                        <li key={field.id}>
                          <span className="font-medium">{field.label}:</span> {field.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                variant="outline"
                className="flex-1"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lagre som utkast
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1"
              >
                Publiser avtale
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep < STEPS.length - 1 && (
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onBack : prevStep}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? 'Tilbake' : 'Forrige'}
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === 1 && !basicData.title.trim()}
            >
              Neste
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
      
      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={handleFileSelected}
        userId={userId}
      />
    </Card>
  );
};
