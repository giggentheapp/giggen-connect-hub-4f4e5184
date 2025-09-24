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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, ChevronLeft, ChevronRight, Eye, Save, X, Video, Music, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConceptPortfolioUpload from '@/components/ConceptPortfolioUpload';
import { useProfileTechSpecs } from '@/hooks/useProfileTechSpecs';
import { useHospitalityRiders } from '@/hooks/useHospitalityRiders';
import { useAppTranslation } from '@/hooks/useAppTranslation';

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
  // Flexible pricing options
  pricing_type: 'fixed' | 'door_deal' | 'by_agreement';
  door_percentage: string;
}

interface ConceptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const STEPS = [
  { id: 'basic', title: 'basic', description: 'basic' },
  { id: 'details', title: 'details', description: 'details' },
  { id: 'portfolio', title: 'portfolio', description: 'portfolio' },
  { id: 'technical', title: 'technical', description: 'technical' },
  { id: 'dates', title: 'dates', description: 'dates' },
  { id: 'preview', title: 'preview', description: 'preview' },
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
  const { t } = useAppTranslation();

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
    // Flexible pricing options
    pricing_type: 'fixed',
    door_percentage: '',
  }));

  const updateConceptData = (field: keyof ConceptData, value: any) => {
    setConceptData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploaded = (fileData: any) => {
    // Add comprehensive validation
    if (!fileData || !fileData.filename || !fileData.file_path) {
      toast({
        title: t('conceptWizard.messages.invalidFileData'),
        description: t('conceptWizard.messages.invalidFileData'),
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
            title: t('conceptWizard.messages.filesSaveWarning'),
            description: t('conceptWizard.messages.filesSaveWarningDescription'),
            variant: "destructive",
          });
        }
      }

      toast({
        title: isPublished ? t('conceptWizard.messages.published') : t('conceptWizard.messages.draftSaved'),
        description: isPublished ? t('conceptWizard.messages.publishedDescription') : t('conceptWizard.messages.draftSavedDescription'),
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: t('conceptWizard.messages.saveError'),
        description: error.message || t('conceptWizard.messages.unknownError'),
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
        const audienceValid = conceptData.expected_audience.length > 0 && parseInt(conceptData.expected_audience) > 0;
        const pricingValid = conceptData.pricing_type === 'by_agreement' || 
                            (conceptData.pricing_type === 'fixed' && conceptData.price.length > 0 && parseFloat(conceptData.price) > 0) ||
                            (conceptData.pricing_type === 'door_deal' && conceptData.door_percentage.length > 0 && parseFloat(conceptData.door_percentage) > 0);
        return audienceValid && pricingValid;
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
              {t('conceptWizard.title')}
            </CardTitle>
            <CardDescription>
              {t(`conceptWizard.steps.${STEPS[currentStep].title}.title`)} - {t(`conceptWizard.steps.${STEPS[currentStep].description}.description`)}
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
                <Label htmlFor="title">{t('conceptWizard.basic.titleLabel')}</Label>
                <Input
                  id="title"
                  placeholder={t('conceptWizard.basic.titlePlaceholder')}
                  value={conceptData.title}
                  onChange={(e) => updateConceptData('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">{t('conceptWizard.basic.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('conceptWizard.basic.descriptionPlaceholder')}
                  value={conceptData.description}
                  onChange={(e) => updateConceptData('description', e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Pricing Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <Label className="text-base font-semibold">{t('conceptWizard.details.pricingModel')}</Label>
                <RadioGroup
                  value={conceptData.pricing_type}
                  onValueChange={(value: 'fixed' | 'door_deal' | 'by_agreement') => {
                    updateConceptData('pricing_type', value);
                    // Clear related fields when switching types
                    if (value !== 'fixed') updateConceptData('price', '');
                    if (value !== 'door_deal') updateConceptData('door_percentage', '');
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed-price" />
                    <Label htmlFor="fixed-price" className="cursor-pointer">{t('conceptWizard.details.fixedPrice')}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="door_deal" id="door-deal" />
                    <Label htmlFor="door-deal" className="cursor-pointer">{t('conceptWizard.details.doorDeal')}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="by_agreement" id="by-agreement" />
                    <Label htmlFor="by-agreement" className="cursor-pointer">{t('conceptWizard.details.byAgreement')}</Label>
                  </div>
                </RadioGroup>

                {/* Fixed Price Input */}
                {conceptData.pricing_type === 'fixed' && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                    <Label htmlFor="price">{t('conceptWizard.details.priceLabel')}</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder={t('conceptWizard.details.pricePlaceholder')}
                      value={conceptData.price}
                      onChange={(e) => updateConceptData('price', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {t('conceptWizard.details.priceDescription')}
                    </p>
                  </div>
                )}

                {/* Door Deal Input */}
                {conceptData.pricing_type === 'door_deal' && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <Label htmlFor="door-percentage">{t('conceptWizard.details.doorPercentageLabel')}</Label>
                    <Input
                      id="door-percentage"
                      type="number"
                      placeholder={t('conceptWizard.details.doorPercentagePlaceholder')}
                      value={conceptData.door_percentage}
                      onChange={(e) => updateConceptData('door_percentage', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {t('conceptWizard.details.doorPercentageDescription').replace('{percentage}', conceptData.door_percentage || 'X')}
                    </p>
                  </div>
                )}

                {/* By Agreement */}
                {conceptData.pricing_type === 'by_agreement' && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {t('conceptWizard.details.byAgreementDescription')}
                    </p>
                  </div>
                )}
              </div>

              {/* Audience Section */}
              <div>
                <Label htmlFor="audience">{t('conceptWizard.details.audienceLabel')}</Label>
                <Input
                  id="audience"
                  type="number"
                  placeholder={t('conceptWizard.details.audiencePlaceholder')}
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
                <Label htmlFor="techspec">{t('conceptWizard.technical.techSpecLabel')}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('conceptWizard.technical.techSpecDescription')}
                </p>
                <Select
                  value={conceptData.selected_tech_spec_file}
                  onValueChange={(value) => updateConceptData('selected_tech_spec_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('conceptWizard.technical.techSpecPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {techSpecsLoading ? (
                      <SelectItem value="loading" disabled>
                        {t('conceptWizard.technical.loading')}
                      </SelectItem>
                    ) : availableTechSpecs.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t('conceptWizard.technical.noTechSpecs')}
                      </SelectItem>
                     ) : (
                       Array.isArray(availableTechSpecs) ? availableTechSpecs.filter(file => file && file.id).map((file) => (
                         <SelectItem key={file.id} value={file.id}>
                           {file.filename || t('conceptWizard.technical.unnamedFile')}
                         </SelectItem>
                       )) : <></>
                     )}
                  </SelectContent>
                </Select>
                {availableTechSpecs.length === 0 && !techSpecsLoading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('conceptWizard.technical.techSpecUploadTip')}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="hospitalityrider">{t('conceptWizard.technical.hospitalityRiderLabel')}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('conceptWizard.technical.hospitalityRiderDescription')}
                </p>
                <Select
                  value={conceptData.selected_hospitality_rider_file}
                  onValueChange={(value) => updateConceptData('selected_hospitality_rider_file', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('conceptWizard.technical.hospitalityRiderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalityRidersLoading ? (
                      <SelectItem value="loading" disabled>
                        {t('conceptWizard.technical.loading')}
                      </SelectItem>
                    ) : availableHospitalityRiders.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t('conceptWizard.technical.noHospitalityRiders')}
                      </SelectItem>
                     ) : (
                       Array.isArray(availableHospitalityRiders) ? availableHospitalityRiders.filter(file => file && file.id).map((file) => (
                         <SelectItem key={file.id} value={file.id}>
                           {file.filename || t('conceptWizard.technical.unnamedFile')}
                         </SelectItem>
                       )) : <></>
                     )}
                  </SelectContent>
                </Select>
                {availableHospitalityRiders.length === 0 && !hospitalityRidersLoading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('conceptWizard.technical.hospitalityRiderUploadTip')}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label>{t('conceptWizard.dates.availableDatesLabel')}</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('conceptWizard.dates.availableDatesDescription')}
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
                    {t('conceptWizard.dates.indefiniteLabel')}
                  </Label>
                </div>

                {conceptData.is_indefinite ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t('conceptWizard.dates.indefiniteDescription')}
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
                          {t('conceptWizard.dates.addDate')}
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
                    <strong>{t('conceptWizard.preview.price')}</strong>{' '}
                    {conceptData.pricing_type === 'fixed' && conceptData.price
                      ? `${conceptData.price} Kr`
                      : conceptData.pricing_type === 'door_deal' && conceptData.door_percentage
                      ? t('conceptWizard.preview.doorRevenue').replace('{percentage}', conceptData.door_percentage)
                      : conceptData.pricing_type === 'by_agreement'
                      ? t('conceptWizard.preview.byAgreement')
                      : t('conceptWizard.preview.notSpecified')
                    }
                  </div>
                  <div>
                    <strong>{t('conceptWizard.preview.expectedAudience')}</strong> {conceptData.expected_audience} {t('conceptWizard.preview.people')}
                  </div>
                </div>

                {conceptData.portfolio_files.length > 0 && (
                  <div>
                    <strong>{t('conceptWizard.preview.portfolioFiles')}</strong>
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
                              <p className="text-xs text-muted-foreground">{file.file_type?.split('/')[0] || t('conceptWizard.preview.file')}</p>
                            </div>
                          </div>
                        )) : <></>}
                      </div>
                  </div>
                )}

                <div>
                  <strong>{t('conceptWizard.preview.availableDates')}</strong>
                  {conceptData.is_indefinite ? (
                    <div className="mt-2">
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm">
                        {t('conceptWizard.preview.indefinite')}
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
                      <span className="text-muted-foreground text-sm">{t('conceptWizard.dates.noDatesSelected')}</span>
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
                  {t('conceptWizard.preview.saveAsDraft')}
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
                  {t('conceptWizard.preview.publishOffer')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('conceptWizard.confirmDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('conceptWizard.confirmDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                {t('conceptWizard.confirmDialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleSave(saveAsPublished);
                }}
                disabled={saving}
              >
                {saveAsPublished ? t('conceptWizard.confirmDialog.publish') : t('conceptWizard.confirmDialog.saveDraft')}
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
              {t('conceptWizard.navigation.previous')}
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              {t('conceptWizard.navigation.next')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};