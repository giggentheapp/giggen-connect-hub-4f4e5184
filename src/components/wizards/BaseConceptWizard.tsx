import { useState, useRef, ComponentType, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { ChevronLeft, ChevronRight, Save, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Base wizard step configuration
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: ComponentType<WizardStepProps>;
  validation?: (data: any) => boolean;
}

/**
 * Props passed to each step component
 */
export interface WizardStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
  userId: string;
  availableTechSpecs?: any[];
  availableHospitalityRiders?: any[];
  [key: string]: any;
}

/**
 * Main wizard configuration
 */
export interface WizardConfig {
  conceptType: string;
  steps: WizardStep[];
  defaultData: any;
  onSave: (data: any, isPublished: boolean) => Promise<void>;
  onBack?: () => void;
  layout?: 'sticky-header' | 'card';
}

interface BaseConceptWizardProps {
  config: WizardConfig;
  userId: string;
}

/**
 * BaseConceptWizard - Reusable wizard foundation for all concept types
 * 
 * This component handles:
 * - Step navigation (next/prev)
 * - Progress indicator
 * - Save draft / publish
 * - Validation
 * - Loading states
 * - Layout variants (sticky-header for session_musician, card for teaching)
 */
export const BaseConceptWizard = ({ config, userId }: BaseConceptWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Use ref to store initial data and prevent re-initialization on config changes
  const initialDataRef = useRef(config.defaultData);
  const [data, setData] = useState(initialDataRef.current);
  
  const { toast } = useToast();
  
  // Load tech specs and hospitality riders for all types
  const { files: availableTechSpecs } = useProfileTechSpecs(userId);
  const { files: availableHospitalityRiders } = useHospitalityRiders(userId);

  const updateData = useCallback((field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await config.onSave(data, false);
      toast({
        title: '✓ Utkast lagret',
        description: 'Dine endringer er trygt lagret',
      });
    } catch (error: any) {
      toast({
        title: 'Kunne ikke lagre',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [config, data, toast]);

  const handlePublish = useCallback(async () => {
    // Validate all steps before publishing
    const invalidStep = config.steps.findIndex((step) => {
      if (step.validation && !step.validation(data)) {
        return true;
      }
      return false;
    });

    if (invalidStep !== -1) {
      setCurrentStep(invalidStep);
      toast({
        title: 'Manglende informasjon',
        description: `Vennligst fyll ut påkrevde felter i steg ${invalidStep + 1}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await config.onSave(data, true);
      toast({
        title: '🎉 Tilbud publisert!',
        description: 'Ditt tilbud er nå synlig for andre',
      });
    } catch (error: any) {
      toast({
        title: 'Kunne ikke publisere',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [config, data, toast]);

  const nextStep = useCallback(() => {
    const currentStepConfig = config.steps[currentStep];
    if (currentStepConfig.validation && !currentStepConfig.validation(data)) {
      toast({
        title: 'Fyll ut påkrevde felter',
        description: 'Vennligst fyll ut alle påkrevde felter før du går videre',
        variant: 'destructive',
      });
      return;
    }
    if (currentStep < config.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [config.steps, currentStep, data, toast]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Memoize the current step component to prevent unnecessary re-renders
  const CurrentStepComponent = useMemo(() => {
    return config.steps[currentStep].component;
  }, [config.steps, currentStep]);

  const currentStepId = config.steps[currentStep].id;
  const currentStepTitle = config.steps[currentStep].title;
  const currentStepDescription = config.steps[currentStep].description;
  const isLastStep = currentStep === config.steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Card layout (for teaching)
  if (config.layout === 'card') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {config.conceptType === 'teaching' ? 'Opprett Undervisningsavtale' : 'Opprett Tilbud'}
          </CardTitle>
          <CardDescription>
            {currentStepTitle} - {currentStepDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-between items-center overflow-x-auto pb-2">
            {config.steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                {index < config.steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            <CurrentStepComponent
              key={currentStepId}
              data={data}
              updateData={updateData}
              userId={userId}
              availableTechSpecs={availableTechSpecs}
              availableHospitalityRiders={availableHospitalityRiders}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={isFirstStep ? config.onBack : prevStep}
              disabled={saving}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {isFirstStep ? 'Tilbake' : 'Forrige'}
            </Button>

            <div className="flex gap-2">
              {isLastStep ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Lagrer...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lagre utkast
                      </>
                    )}
                  </Button>
                  <Button onClick={handlePublish} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publiserer...
                      </>
                    ) : (
                      'Publiser'
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={nextStep} disabled={saving}>
                  Neste
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sticky header layout (for session_musician)
  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={config.onBack}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lagre utkast
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {config.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                disabled={saving}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {currentStepTitle}
            </h2>
            <p className="text-muted-foreground">
              {currentStepDescription}
            </p>
          </div>

          <CurrentStepComponent
            key={currentStepId}
            data={data}
            updateData={updateData}
            userId={userId}
            availableTechSpecs={availableTechSpecs}
            availableHospitalityRiders={availableHospitalityRiders}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isFirstStep || saving}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Forrige
            </Button>

            {isLastStep ? (
              <Button onClick={handlePublish} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publiserer...
                  </>
                ) : (
                  '🎉 Publiser tilbud'
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={saving}>
                Neste
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
};