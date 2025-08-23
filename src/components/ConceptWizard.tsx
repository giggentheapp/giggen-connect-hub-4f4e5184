import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight, Eye, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConceptData {
  title: string;
  description: string;
  price: string;
  expected_audience: string;
  tech_spec: string;
  available_dates: Date[];
}

interface ConceptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  editingConcept?: any;
}

const STEPS = [
  { id: 'basic', title: 'Grunnleggende info', description: 'Tittel og beskrivelse' },
  { id: 'details', title: 'Detaljer', description: 'Pris og publikum' },
  { id: 'technical', title: 'Tekniske krav', description: 'Utstyr og spesifikasjoner' },
  { id: 'dates', title: 'Tilgjengelighet', description: 'Velg tilgjengelige datoer' },
  { id: 'preview', title: 'Forhåndsvisning', description: 'Se over og lagre' },
];

export const ConceptWizard = ({ isOpen, onClose, onSuccess, userId, editingConcept }: ConceptWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [conceptData, setConceptData] = useState<ConceptData>(() => ({
    title: editingConcept?.title || '',
    description: editingConcept?.description || '',
    price: editingConcept?.price?.toString() || '',
    expected_audience: editingConcept?.expected_audience?.toString() || '',
    tech_spec: editingConcept?.tech_spec || '',
    available_dates: editingConcept?.available_dates || [],
  }));

  const updateConceptData = (field: keyof ConceptData, value: any) => {
    setConceptData(prev => ({ ...prev, [field]: value }));
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
        available_dates: conceptData.available_dates.length > 0 ? JSON.stringify(conceptData.available_dates) : null,
        is_published: isPublished,
        status: isPublished ? 'published' : 'draft'
      };

      let error;
      if (editingConcept) {
        const { error: updateError } = await supabase
          .from('concepts')
          .update(conceptPayload)
          .eq('id', editingConcept.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('concepts')
          .insert(conceptPayload);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: isPublished ? "Konsept publisert!" : "Konsept lagret!",
        description: isPublished ? "Konseptet er nå tilgjengelig for andre" : "Konseptet er lagret som utkast",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return conceptData.title.trim().length > 0;
      case 1: return conceptData.price.length > 0 && conceptData.expected_audience.length > 0;
      case 2: return true; // Tech spec is optional
      case 3: return conceptData.available_dates.length > 0;
      case 4: return true; // Preview step
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>
              {editingConcept ? 'Rediger konsept' : 'Opprett nytt konsept'}
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
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
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
            ))}
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="techspec">Tekniske krav og utstyr</Label>
                <Textarea
                  id="techspec"
                  placeholder="Beskriv tekniske krav som lydanlegg, scene, strøm, etc."
                  value={conceptData.tech_spec}
                  onChange={(e) => updateConceptData('tech_spec', e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Tilgjengelige datoer *</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg datoer når du er tilgjengelig for dette konseptet
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {conceptData.available_dates.map((date, index) => (
                    <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
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
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
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
              </div>
            </div>
          )}

          {currentStep === 4 && (
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

                {conceptData.tech_spec && (
                  <div>
                    <strong>Tekniske krav:</strong>
                    <p className="mt-1 text-sm">{conceptData.tech_spec}</p>
                  </div>
                )}

                {conceptData.available_dates.length > 0 && (
                  <div>
                    <strong>Tilgjengelige datoer:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {conceptData.available_dates.map((date, index) => (
                        <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {format(date, 'dd.MM.yyyy')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre som utkast
                </Button>
                <Button
                  onClick={() => handleSave(true)}
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

        {/* Navigation */}
        {currentStep < 4 && (
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