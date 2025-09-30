import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, CheckCircle, Loader2 } from 'lucide-react';
import ConceptPortfolioUpload from '@/components/ConceptPortfolioUpload';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ConceptData {
  id?: string;
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
  pricing_type: 'fixed' | 'door_deal' | 'by_agreement';
  door_percentage: string;
}

const STEPS = [
  { id: 'basic', title: 'Grunnleggende', description: 'Tittel og beskrivelse' },
  { id: 'details', title: 'Detaljer', description: 'Pris og publikum' },
  { id: 'portfolio', title: 'Portfolio', description: 'Last opp filer' },
  { id: 'technical', title: 'Teknisk', description: 'Tech spec og rider' },
  { id: 'dates', title: 'Datoer', description: 'Tilgjengelige datoer' },
  { id: 'preview', title: 'Forhåndsvisning', description: 'Gjennomgå og publiser' },
];

export default function CreateOffer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('edit');
  const { toast } = useToast();
  const { t } = useAppTranslation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!draftId);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const [conceptData, setConceptData] = useState<ConceptData>({
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
    pricing_type: 'fixed',
    door_percentage: '',
  });

  const { files: availableTechSpecs } = useProfileTechSpecs(userId);
  const { files: availableHospitalityRiders } = useHospitalityRiders(userId);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Load draft data if editing
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !userId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('concepts')
          .select('*, concept_files(*)')
          .eq('id', draftId)
          .single();

        if (error) throw error;

        // Parse and set data
        const availableDates = data.available_dates 
          ? (typeof data.available_dates === 'string' 
              ? JSON.parse(data.available_dates) 
              : data.available_dates)
          : null;

        const isIndefinite = availableDates && typeof availableDates === 'object' && 'indefinite' in availableDates;
        const dateArray = Array.isArray(availableDates) ? availableDates : [];

        setConceptData({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          expected_audience: data.expected_audience?.toString() || '',
          tech_spec: data.tech_spec || '',
          available_dates: dateArray.map((d: any) => new Date(d)),
          portfolio_files: data.concept_files || [],
          selected_tech_spec_file: data.tech_spec_reference || '',
          selected_hospitality_rider_file: data.hospitality_rider_reference || '',
          is_indefinite: isIndefinite,
          pricing_type: data.door_deal ? 'door_deal' : data.price_by_agreement ? 'by_agreement' : 'fixed',
          door_percentage: data.door_percentage?.toString() || '',
        });

        toast({
          title: 'Utkast lastet',
          description: 'Fortsett der du slapp',
        });
      } catch (error: any) {
        console.error('Error loading draft:', error);
        toast({
          title: 'Kunne ikke laste utkast',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [draftId, userId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !hasChanges || !conceptData.title.trim()) return;

    const interval = setInterval(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, hasChanges, conceptData]);

  const updateConceptData = (field: keyof ConceptData, value: any) => {
    setConceptData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleFileUploaded = (fileData: any) => {
    setConceptData(prev => ({
      ...prev,
      portfolio_files: [...prev.portfolio_files, {
        ...fileData,
        tempId: Date.now() + Math.random(),
        title: fileData.title || fileData.filename,
        uploadedAt: new Date().toISOString()
      }]
    }));
    setHasChanges(true);
  };

  const removePortfolioFile = async (fileData: any) => {
    if (fileData.file_path) {
      try {
        await supabase.storage
          .from('concept-drafts')
          .remove([fileData.file_path]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    
    setConceptData(prev => ({
      ...prev,
      portfolio_files: prev.portfolio_files.filter(file => 
        file.tempId !== fileData.tempId && file.id !== fileData.id
      )
    }));
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!conceptData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        description: 'Du må legge til en tittel før du lagrer',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        maker_id: userId,
        title: conceptData.title,
        description: conceptData.description || null,
        price: conceptData.pricing_type === 'fixed' && conceptData.price ? parseFloat(conceptData.price) : null,
        door_deal: conceptData.pricing_type === 'door_deal',
        door_percentage: conceptData.pricing_type === 'door_deal' && conceptData.door_percentage ? parseFloat(conceptData.door_percentage) : null,
        price_by_agreement: conceptData.pricing_type === 'by_agreement',
        expected_audience: conceptData.expected_audience ? parseInt(conceptData.expected_audience) : null,
        tech_spec: conceptData.tech_spec || null,
        tech_spec_reference: conceptData.selected_tech_spec_file || null,
        hospitality_rider_reference: conceptData.selected_hospitality_rider_file || null,
        available_dates: conceptData.is_indefinite 
          ? JSON.stringify({ indefinite: true })
          : (conceptData.available_dates.length > 0 ? JSON.stringify(conceptData.available_dates) : null),
        is_published: false,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      let conceptId = conceptData.id;

      if (conceptId) {
        // Update existing draft
        const { error } = await supabase
          .from('concepts')
          .update(payload)
          .eq('id', conceptId);
        
        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('concepts')
          .insert(payload)
          .select('id')
          .single();
        
        if (error) throw error;
        conceptId = data.id;
        setConceptData(prev => ({ ...prev, id: conceptId }));
      }

      // Handle files
      if (conceptData.portfolio_files.length > 0 && conceptId) {
        const fileRecords = conceptData.portfolio_files
          .filter(file => file && file.filename && !file.id)
          .map(file => ({
            creator_id: userId,
            concept_id: conceptId,
            filename: file.filename,
            file_path: file.file_path,
            file_type: file.file_type,
            file_url: file.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concept-drafts/${file.file_path}`,
            mime_type: file.mime_type,
            file_size: file.file_size,
            title: file.title || file.filename,
            is_public: false
          }));

        if (fileRecords.length > 0) {
          await supabase.from('concept_files').insert(fileRecords);
        }
      }

      toast({
        title: '✓ Utkast lagret',
        description: 'Dine endringer er trygt lagret',
      });

      setHasChanges(false);
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

  const handlePublish = async () => {
    // Validate all required fields
    if (!conceptData.title.trim()) {
      toast({
        title: 'Tittel påkrevd',
        variant: 'destructive',
      });
      return;
    }

    if (!conceptData.expected_audience || parseInt(conceptData.expected_audience) <= 0) {
      toast({
        title: 'Publikumsestimat påkrevd',
        variant: 'destructive',
      });
      return;
    }

    if (conceptData.pricing_type === 'fixed' && (!conceptData.price || parseFloat(conceptData.price) <= 0)) {
      toast({
        title: 'Pris påkrevd',
        variant: 'destructive',
      });
      return;
    }

    if (conceptData.pricing_type === 'door_deal' && (!conceptData.door_percentage || parseFloat(conceptData.door_percentage) <= 0)) {
      toast({
        title: 'Døravtale prosent påkrevd',
        variant: 'destructive',
      });
      return;
    }

    if (!conceptData.is_indefinite && conceptData.available_dates.length === 0) {
      toast({
        title: 'Tilgjengelige datoer påkrevd',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let conceptId = conceptData.id;

      // If no conceptId exists, create the concept first
      if (!conceptId) {
        const payload = {
          maker_id: userId,
          title: conceptData.title,
          description: conceptData.description || null,
          price: conceptData.pricing_type === 'fixed' && conceptData.price ? parseFloat(conceptData.price) : null,
          door_deal: conceptData.pricing_type === 'door_deal',
          door_percentage: conceptData.pricing_type === 'door_deal' && conceptData.door_percentage ? parseFloat(conceptData.door_percentage) : null,
          price_by_agreement: conceptData.pricing_type === 'by_agreement',
          expected_audience: conceptData.expected_audience ? parseInt(conceptData.expected_audience) : null,
          tech_spec: conceptData.tech_spec || null,
          tech_spec_reference: conceptData.selected_tech_spec_file || null,
          hospitality_rider_reference: conceptData.selected_hospitality_rider_file || null,
          available_dates: conceptData.is_indefinite 
            ? JSON.stringify({ indefinite: true })
            : (conceptData.available_dates.length > 0 ? JSON.stringify(conceptData.available_dates) : null),
          is_published: false,
          status: 'draft',
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('concepts')
          .insert(payload)
          .select('id')
          .single();
        
        if (error) throw error;
        conceptId = data.id;

        // Save any portfolio files
        if (conceptData.portfolio_files.length > 0) {
          const fileRecords = conceptData.portfolio_files
            .filter(file => file && file.filename && !file.id)
            .map(file => ({
              creator_id: userId,
              concept_id: conceptId,
              filename: file.filename,
              file_path: file.file_path,
              file_type: file.file_type,
              file_url: file.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concept-drafts/${file.file_path}`,
              mime_type: file.mime_type,
              file_size: file.file_size,
              title: file.title || file.filename,
              is_public: false
            }));

          if (fileRecords.length > 0) {
            await supabase.from('concept_files').insert(fileRecords);
          }
        }
      }

      // Move files from draft bucket to production bucket
      if (conceptData.portfolio_files.length > 0) {
        for (const file of conceptData.portfolio_files) {
          if (file.file_path?.startsWith(`${userId}/`)) {
            try {
              // Try to download from draft bucket
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('concept-drafts')
                .download(file.file_path);

              if (!downloadError && fileData) {
                // Upload to production bucket
                const newPath = file.file_path;
                const { error: uploadError } = await supabase.storage
                  .from('concepts')
                  .upload(newPath, fileData, {
                    contentType: file.mime_type,
                    upsert: true
                  });

                if (!uploadError) {
                  // Delete from draft bucket
                  await supabase.storage
                    .from('concept-drafts')
                    .remove([file.file_path]);

                  // Update file URL if file has an id
                  if (file.id) {
                    await supabase
                      .from('concept_files')
                      .update({
                        file_url: `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/concepts/${newPath}`,
                        is_public: true
                      })
                      .eq('id', file.id);
                  }
                }
              }
            } catch (fileError) {
              console.warn('Could not move file from draft to production:', fileError);
              // Continue with other files
            }
          }
        }
      }

      // Update concept to published
      const { error: updateError } = await supabase
        .from('concepts')
        .update({
          is_published: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', conceptId);

      if (updateError) throw updateError;

      toast({
        title: '🎉 Tilbud publisert!',
        description: 'Ditt tilbud er nå synlig for andre',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Publish error:', error);
      toast({
        title: 'Kunne ikke publisere',
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

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return conceptData.title.trim().length > 0;
      case 1:
        const audienceValid = conceptData.expected_audience.length > 0 && parseInt(conceptData.expected_audience) > 0;
        const pricingValid = conceptData.pricing_type === 'by_agreement' || 
                            (conceptData.pricing_type === 'fixed' && conceptData.price.length > 0) ||
                            (conceptData.pricing_type === 'door_deal' && conceptData.door_percentage.length > 0);
        return audienceValid && pricingValid;
      case 4:
        return conceptData.available_dates.length > 0 || conceptData.is_indefinite;
      default:
        return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>

            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      index <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-0.5 mx-1 transition-colors",
                        index < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < STEPS.length - 1 && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving || !conceptData.title.trim()}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lagre utkast
                </Button>
              )}
              {currentStep === STEPS.length - 1 && (
                <Button
                  onClick={handlePublish}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Publiser tilbud
                </Button>
              )}
            </div>
          </div>

          {/* Mobile progress */}
          <div className="md:hidden mt-3">
            <div className="text-xs text-muted-foreground mb-2">
              Steg {currentStep + 1} av {STEPS.length}: {STEPS[currentStep].title}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{STEPS[currentStep].title}</h1>
          <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
        </div>

        <Separator className="mb-6" />

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  placeholder="F.eks. 'Live Jazz Konsert'"
                  value={conceptData.title}
                  onChange={(e) => updateConceptData('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Beskriv ditt tilbud..."
                  value={conceptData.description}
                  onChange={(e) => updateConceptData('description', e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <Label className="text-base font-semibold">Prismodell *</Label>
                <RadioGroup
                  value={conceptData.pricing_type}
                  onValueChange={(value: any) => {
                    updateConceptData('pricing_type', value);
                    if (value !== 'fixed') updateConceptData('price', '');
                    if (value !== 'door_deal') updateConceptData('door_percentage', '');
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed-price" />
                    <Label htmlFor="fixed-price" className="cursor-pointer">Fast pris</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="door_deal" id="door-deal" />
                    <Label htmlFor="door-deal" className="cursor-pointer">Døravtale (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="by_agreement" id="by-agreement" />
                    <Label htmlFor="by-agreement" className="cursor-pointer">Pris etter avtale</Label>
                  </div>
                </RadioGroup>

                {conceptData.pricing_type === 'fixed' && (
                  <div>
                    <Label htmlFor="price">Pris (NOK) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="15000"
                      value={conceptData.price}
                      onChange={(e) => updateConceptData('price', e.target.value)}
                    />
                  </div>
                )}

                {conceptData.pricing_type === 'door_deal' && (
                  <div>
                    <Label htmlFor="door-percentage">Prosent av inntekter *</Label>
                    <Input
                      id="door-percentage"
                      type="number"
                      placeholder="70"
                      value={conceptData.door_percentage}
                      onChange={(e) => updateConceptData('door_percentage', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="audience">Forventet publikum *</Label>
                <Input
                  id="audience"
                  type="number"
                  placeholder="100"
                  value={conceptData.expected_audience}
                  onChange={(e) => updateConceptData('expected_audience', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Portfolio */}
          {currentStep === 2 && (
            <ConceptPortfolioUpload
              userId={userId}
              files={conceptData.portfolio_files}
              onFileUploaded={handleFileUploaded}
              onFileRemoved={removePortfolioFile}
            />
          )}

          {/* Step 3: Technical */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="tech-spec-select">Tech Spec (valgfritt)</Label>
                <Select
                  value={conceptData.selected_tech_spec_file}
                  onValueChange={(value) => updateConceptData('selected_tech_spec_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg tech spec..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechSpecs.map((spec) => (
                      <SelectItem key={spec.id} value={spec.id}>
                        {spec.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hospitality-select">Hospitality Rider (valgfritt)</Label>
                <Select
                  value={conceptData.selected_hospitality_rider_file}
                  onValueChange={(value) => updateConceptData('selected_hospitality_rider_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg hospitality rider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHospitalityRiders.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id}>
                        {rider.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tech-spec">Tekniske notater</Label>
                <Textarea
                  id="tech-spec"
                  placeholder="Evt. tekniske krav eller merknader..."
                  value={conceptData.tech_spec}
                  onChange={(e) => updateConceptData('tech_spec', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Step 4: Dates */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="indefinite"
                  checked={conceptData.is_indefinite}
                  onCheckedChange={(checked) => updateConceptData('is_indefinite', checked)}
                />
                <Label htmlFor="indefinite">Tilgjengelig på ubestemt tid</Label>
              </div>

              {!conceptData.is_indefinite && (
                <div>
                  <Label>Velg tilgjengelige datoer *</Label>
                  <Calendar
                    mode="multiple"
                    selected={conceptData.available_dates}
                    onSelect={(dates) => updateConceptData('available_dates', dates || [])}
                    className="rounded-md border"
                    disabled={{ before: new Date() }}
                  />
                  {conceptData.available_dates.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {conceptData.available_dates.length} dato(er) valgt
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preview */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="p-6 border rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{conceptData.title}</h3>
                  <p className="text-muted-foreground mt-1">{conceptData.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Pris:</span>
                    <p className="font-medium">
                      {conceptData.pricing_type === 'fixed' && `${conceptData.price} NOK`}
                      {conceptData.pricing_type === 'door_deal' && `${conceptData.door_percentage}% døravtale`}
                      {conceptData.pricing_type === 'by_agreement' && 'Etter avtale'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Publikum:</span>
                    <p className="font-medium">{conceptData.expected_audience} personer</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Portfolio filer:</span>
                  <p className="font-medium">{conceptData.portfolio_files.length} fil(er)</p>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Tilgjengelighet:</span>
                  <p className="font-medium">
                    {conceptData.is_indefinite
                      ? 'Tilgjengelig på ubestemt tid'
                      : `${conceptData.available_dates.length} dato(er) valgt`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Klar til å publisere! Ditt tilbud vil være synlig for alle brukere.</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Forrige
          </Button>

          {currentStep < STEPS.length - 1 && (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Neste
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
