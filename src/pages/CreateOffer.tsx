import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConceptTypeSelector } from '@/components/ConceptTypeSelector';
import { TeachingConceptWizard } from '@/components/TeachingConceptWizard';
import { ArrangørOfferWizard } from '@/components/ArrangørOfferWizard';
import { SessionMusicianWizard } from '@/components/wizards/SessionMusicianWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Loader2, Music, FileText, Plus, X, Image, Video, File as FileIcon, Download, CheckCircle } from 'lucide-react';
import { FilebankSelectionModal } from '@/components/FilebankSelectionModal';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { conceptService } from '@/services/conceptService';
import { useRoleData } from '@/hooks/useRole';

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
  program_type?: string;
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
  const { isOrganizer } = useRoleData();
  
  const { user, loading: userLoading } = useCurrentUser();
  const userId = user?.id || '';
  
  const [conceptType, setConceptType] = useState<'session_musician' | 'teaching' | 'arrangør_tilbud' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!draftId);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFilebankModal, setShowFilebankModal] = useState(false);
  const [showTechSpecModal, setShowTechSpecModal] = useState(false);
  const [showHospitalityModal, setShowHospitalityModal] = useState(false);
  const [selectedTechSpecFile, setSelectedTechSpecFile] = useState<any>(null);
  const [selectedHospitalityFile, setSelectedHospitalityFile] = useState<any>(null);
  const [loadedTeachingConcept, setLoadedTeachingConcept] = useState<any>(null);
  const [isEditingPublished, setIsEditingPublished] = useState(false);

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


  // Load draft data if editing
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !userId) return;

      setLoading(true);
      try {
        const data = await conceptService.getById(draftId, true); // Include drafts
        if (!data) {
          throw new Error('Concept not found');
        }

        const files = await conceptService.getConceptFiles(draftId);

        console.log('📂 Loading concept for editing:', {
          conceptId: draftId,
          conceptType: data.concept_type,
          hasFiles: !!files,
          fileCount: files.length
        });

        // Set concept type from database
        if (data.concept_type) {
          setConceptType(data.concept_type as 'session_musician' | 'teaching');
          
          // If it's a teaching concept, store the full concept for TeachingConceptWizard
          if (data.concept_type === 'teaching') {
            setLoadedTeachingConcept({ ...data, concept_files: files });
            setLoading(false);
            return;
          }
        }

        // Parse and set data
        const availableDates = data.available_dates 
          ? (typeof data.available_dates === 'string' 
              ? JSON.parse(data.available_dates) 
              : data.available_dates)
          : null;

        const isIndefinite = availableDates && typeof availableDates === 'object' && 'indefinite' in availableDates;
        const dateArray = Array.isArray(availableDates) ? availableDates : [];

        // Process concept_files - convert them to the format expected by the form
        const portfolioFiles = files.map((file: any) => ({
          conceptFileId: file.id, // Store the concept_file ID
          filebankId: null, // This came from concept_files, not filebank
          filename: file.filename,
          file_path: file.file_path,
          file_type: file.file_type,
          mime_type: file.mime_type,
          file_size: file.file_size,
          file_url: file.file_url,
          publicUrl: file.file_url,
          title: file.title || file.filename,
          thumbnail_path: file.thumbnail_path,
          uploadedAt: file.created_at
        }));

        console.log('✅ Loaded portfolio files:', portfolioFiles);

        // Track if we're editing a published concept
        setIsEditingPublished(data.is_published || false);

        setConceptData({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          expected_audience: data.expected_audience?.toString() || '',
          tech_spec: data.tech_spec || '',
          available_dates: dateArray.map((d: any) => new Date(d)),
          portfolio_files: portfolioFiles,
          selected_tech_spec_file: data.tech_spec_reference || '',
          selected_hospitality_rider_file: data.hospitality_rider_reference || '',
          is_indefinite: isIndefinite,
          pricing_type: data.door_deal ? 'door_deal' : data.price_by_agreement ? 'by_agreement' : 'fixed',
          door_percentage: data.door_percentage?.toString() || '',
          program_type: data.program_type || '',
        });

        // Load tech spec file if reference exists
        if (data.tech_spec_reference) {
          const { data: techSpecFile } = await supabase
            .from('profile_tech_specs')
            .select('*')
            .eq('id', data.tech_spec_reference)
            .single();
          
          if (techSpecFile) {
            setSelectedTechSpecFile(techSpecFile);
          }
        }

        // Load hospitality rider file if reference exists
        if (data.hospitality_rider_reference) {
          const { data: hospitalityFile } = await supabase
            .from('hospitality_riders')
            .select('*')
            .eq('id', data.hospitality_rider_reference)
            .single();
          
          if (hospitalityFile) {
            setSelectedHospitalityFile(hospitalityFile);
          }
        }

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
  }, [draftId, userId, toast]);

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

  const handleFileSelected = (file: any) => {
    // Generate public URL for the file
    const publicUrl = `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`;
    
    setConceptData(prev => ({
      ...prev,
      portfolio_files: [...prev.portfolio_files, {
        filebankId: file.id, // Store original filebank ID separately
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
        fromFilbank: true // Flag to indicate this is from filebank
      }]
    }));
    setHasChanges(true);
    toast({
      title: 'Fil lagt til',
      description: `${file.filename} er lagt til i portfolio`,
    });
  };

  const removePortfolioFile = async (fileData: any) => {
    // If file has a conceptFileId, delete it from the database
    if (fileData.conceptFileId) {
      try {
        console.log('🗑️ Deleting concept file from database:', {
          conceptFileId: fileData.conceptFileId,
          filename: fileData.filename
        });
        
        const { error } = await supabase
          .from('concept_files')
          .delete()
          .eq('id', fileData.conceptFileId);
        
        if (error) {
          console.error('❌ Error deleting concept file:', error);
          toast({
            title: 'Feil ved sletting',
            description: `Kunne ikke slette filen: ${error.message}`,
            variant: 'destructive',
          });
          return;
        }
        
        console.log('✅ Concept file deleted from database');
        
        toast({
          title: 'Fil fjernet',
          description: 'Filen er fjernet fra portfolio og databasen',
        });
      } catch (error) {
        console.error('❌ Exception deleting concept file:', error);
        toast({
          title: 'Feil ved sletting',
          description: 'Kunne ikke slette filen',
          variant: 'destructive',
        });
        return;
      }
    } else {
      toast({
        title: 'Fil fjernet',
        description: 'Filen er fjernet fra portfolio',
      });
    }
    
    // Remove from local state
    setConceptData(prev => ({
      ...prev,
      portfolio_files: prev.portfolio_files.filter(file => 
        file.filebankId !== fileData.filebankId && file.conceptFileId !== fileData.conceptFileId
      )
    }));
    setHasChanges(true);
  };

  const handleTechSpecFileSelected = (file: any) => {
    // Generate public URL if file_url is missing
    let fileUrl = file.file_url;
    if (!fileUrl) {
      const bucket = file.file_path.split('/')[0];
      const path = file.file_path.substring(file.file_path.indexOf('/') + 1);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    // Store file metadata in state for display
    setSelectedTechSpecFile({
      ...file,
      file_url: fileUrl
    });

    // Update conceptData with file reference
    updateConceptData('selected_tech_spec_file', file.id);

    toast({
      title: 'Tech spec valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    
    setShowTechSpecModal(false);
  };

  const handleHospitalityFileSelected = (file: any) => {
    // Generate public URL if file_url is missing
    let fileUrl = file.file_url;
    if (!fileUrl) {
      const bucket = file.file_path.split('/')[0];
      const path = file.file_path.substring(file.file_path.indexOf('/') + 1);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    // Store file metadata in state for display
    setSelectedHospitalityFile({
      ...file,
      file_url: fileUrl
    });

    // Update conceptData with file reference
    updateConceptData('selected_hospitality_rider_file', file.id);

    toast({
      title: 'Hospitality rider valgt',
      description: `${file.filename} vil bli lagt til når tilbudet publiseres`,
    });
    
    setShowHospitalityModal(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('video')) return <Video className="h-4 w-4 text-red-500" />;
    if (fileType.includes('audio')) return <Music className="h-4 w-4 text-green-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
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

    // Tilgangskontroll for arrangør_tilbud
    if (conceptType === 'arrangør_tilbud' && !isOrganizer) {
      toast({
        title: 'Tilgang nektet',
        description: 'Kun arrangører kan opprette arrangør-tilbud',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        maker_id: userId,
        concept_type: conceptType || 'session_musician',
        title: conceptData.title,
        description: conceptData.description || null,
        price: conceptData.pricing_type === 'fixed' && conceptData.price ? parseFloat(conceptData.price) : null,
        door_deal: conceptData.pricing_type === 'door_deal',
        door_percentage: conceptData.pricing_type === 'door_deal' && conceptData.door_percentage ? parseFloat(conceptData.door_percentage) : null,
        price_by_agreement: conceptData.pricing_type === 'by_agreement',
        expected_audience: conceptData.expected_audience ? parseInt(conceptData.expected_audience) : null,
        tech_spec: conceptData.tech_spec || null,
        tech_spec_reference: selectedTechSpecFile?.id || conceptData.selected_tech_spec_file || null,
        hospitality_rider_reference: selectedHospitalityFile?.id || conceptData.selected_hospitality_rider_file || null,
        program_type: conceptData.program_type || null,
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

      // Handle files - only insert files that haven't been saved yet
      if (conceptData.portfolio_files.length > 0 && conceptId) {
        const fileRecords = conceptData.portfolio_files
          .filter(file => file && file.filename && !file.conceptFileId) // Use conceptFileId instead of id
          .map(file => ({
            creator_id: userId,
            concept_id: conceptId,
            filename: file.filename,
            file_path: file.file_path,
            file_type: file.file_type,
            file_url: file.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`,
            mime_type: file.mime_type,
            file_size: file.file_size,
            title: file.title || file.filename,
            thumbnail_path: file.thumbnail_path,
            is_public: false
          }));

        if (fileRecords.length > 0) {
          const { data: insertedFiles } = await supabase.from('concept_files').insert(fileRecords).select('id');
          // Update conceptData with the new concept_file IDs
          if (insertedFiles) {
            setConceptData(prev => ({
              ...prev,
              portfolio_files: prev.portfolio_files.map((file, index) => {
                if (!file.conceptFileId && insertedFiles[index]) {
                  return { ...file, conceptFileId: insertedFiles[index].id };
                }
                return file;
              })
            }));
          }
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
    // Tilgangskontroll for arrangør_tilbud
    if (conceptType === 'arrangør_tilbud' && !isOrganizer) {
      toast({
        title: 'Tilgang nektet',
        description: 'Kun arrangører kan opprette arrangør-tilbud',
        variant: 'destructive',
      });
      return;
    }

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
          concept_type: conceptType || 'session_musician',
          title: conceptData.title,
          description: conceptData.description || null,
          price: conceptData.pricing_type === 'fixed' && conceptData.price ? parseFloat(conceptData.price) : null,
          door_deal: conceptData.pricing_type === 'door_deal',
          door_percentage: conceptData.pricing_type === 'door_deal' && conceptData.door_percentage ? parseFloat(conceptData.door_percentage) : null,
          price_by_agreement: conceptData.pricing_type === 'by_agreement',
          expected_audience: conceptData.expected_audience ? parseInt(conceptData.expected_audience) : null,
          tech_spec: conceptData.tech_spec || null,
          tech_spec_reference: selectedTechSpecFile?.id || conceptData.selected_tech_spec_file || null,
          hospitality_rider_reference: selectedHospitalityFile?.id || conceptData.selected_hospitality_rider_file || null,
          program_type: conceptData.program_type || null,
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
            .filter(file => file && file.filename && !file.conceptFileId) // Use conceptFileId instead of id
            .map(file => ({
              creator_id: userId,
              concept_id: conceptId,
              filename: file.filename,
              file_path: file.file_path,
              file_type: file.file_type,
              file_url: file.publicUrl || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`,
              mime_type: file.mime_type,
              file_size: file.file_size,
              title: file.title || file.filename,
              thumbnail_path: file.thumbnail_path,
              is_public: false
            }));

          if (fileRecords.length > 0) {
            const { data: insertedFiles, error: insertError } = await supabase
              .from('concept_files')
              .insert(fileRecords)
              .select('id');
            
            if (insertError) {
              console.error('Error inserting files:', insertError);
            } else if (insertedFiles) {
              // Update conceptData with the new concept_file IDs
              setConceptData(prev => ({
                ...prev,
                portfolio_files: prev.portfolio_files.map((file, index) => {
                  if (!file.conceptFileId && insertedFiles[index]) {
                    return { ...file, conceptFileId: insertedFiles[index].id };
                  }
                  return file;
                })
              }));
            }
          }
        }
      }

      // Save portfolio files for existing concepts too
      if (conceptId && conceptData.portfolio_files.length > 0) {
        const unsavedFiles = conceptData.portfolio_files.filter(file => file && file.filename && !file.conceptFileId);
        
        console.log('📁 Publishing - Portfolio files status:', {
          totalFiles: conceptData.portfolio_files.length,
          unsavedFiles: unsavedFiles.length,
          files: conceptData.portfolio_files.map(f => ({
            filename: f.filename,
            hasConceptFileId: !!f.conceptFileId,
            file_path: f.file_path
          }))
        });
        
        if (unsavedFiles.length > 0) {
          // Check which files already exist in the database to avoid duplicates
          const { data: existingFiles } = await supabase
            .from('concept_files')
            .select('file_path')
            .eq('concept_id', conceptId);
          
          const existingPaths = new Set(existingFiles?.map(f => f.file_path) || []);
          
          // Only insert files that don't already exist
          const filesToInsert = unsavedFiles.filter(file => !existingPaths.has(file.file_path));
          
          console.log('📊 Files comparison:', {
            unsavedCount: unsavedFiles.length,
            existingCount: existingPaths.size,
            toInsertCount: filesToInsert.length
          });
          
          if (filesToInsert.length > 0) {
            const fileRecords = filesToInsert.map(file => ({
              creator_id: userId,
              concept_id: conceptId,
              filename: file.filename,
              file_path: file.file_path,
              file_type: file.file_type,
              file_url: file.publicUrl || file.file_url || `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`,
              mime_type: file.mime_type,
              file_size: file.file_size,
              title: file.title || file.filename,
              thumbnail_path: file.thumbnail_path,
              is_public: true // Already public since we're publishing
            }));

            console.log('💾 Saving concept files:', fileRecords);

            const { data: savedFiles, error: insertError } = await supabase
              .from('concept_files')
              .insert(fileRecords)
              .select('*');
            
            if (insertError) {
              console.error('❌ Error inserting files for existing concept:', insertError);
              throw insertError;
            }
            
            console.log('✅ Files saved successfully:', savedFiles);
          } else {
            console.log('ℹ️ No new files to insert');
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
        // For arrangør_tilbud, også sjekk program_type
        if (conceptType === 'arrangør_tilbud') {
          const programTypeValid = conceptData.program_type && conceptData.program_type.length > 0;
          const audienceValid = conceptData.expected_audience.length > 0 && parseInt(conceptData.expected_audience) > 0;
          const pricingValid = conceptData.pricing_type === 'by_agreement' || 
                              (conceptData.pricing_type === 'fixed' && conceptData.price.length > 0) ||
                              (conceptData.pricing_type === 'door_deal' && conceptData.door_percentage.length > 0);
          return programTypeValid && audienceValid && pricingValid;
        }
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
      {/* Show type selector if no type selected */}
      {!conceptType && !draftId && (
        <div className="container mx-auto px-4 py-16">
          <ConceptTypeSelector 
            onSelect={setConceptType}
            onBack={() => navigate(-1)}
          />
        </div>
      )}

      {/* Show Teaching Wizard */}
      {conceptType === 'teaching' && (
        <div className="container mx-auto px-4 py-8">
          <TeachingConceptWizard
            userId={userId}
            existingConcept={loadedTeachingConcept}
            onSuccess={() => {
              toast({
                title: 'Suksess!',
                description: 'Undervisningsavtalen er lagret',
              });
              navigate('/dashboard');
            }}
            onBack={() => setConceptType(null)}
          />
        </div>
      )}

      {/* Show Arrangør Tilbud Wizard */}
      {conceptType === 'arrangør_tilbud' && (
        <>
          {/* Sticky Header - samme som session_musician */}
          <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (conceptType && !draftId) {
                      setConceptType(null);
                    } else {
                      navigate('/dashboard');
                    }
                  }}
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
                  {isEditingPublished ? 'Lagre endringer' : 'Lagre utkast'}
                </Button>
              )}
            </div>
          </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm font-medium mb-4">
              📅 Arrangør Tilbud
            </div>
            <h1 className="text-3xl font-bold mb-2">{STEPS[currentStep].title}</h1>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-6">
        <ArrangørOfferWizard
          currentStep={currentStep}
          conceptData={conceptData}
          updateConceptData={updateConceptData}
          onOpenFilebankModal={() => setShowFilebankModal(true)}
          onOpenTechSpecModal={() => setShowTechSpecModal(true)}
          onOpenHospitalityModal={() => setShowHospitalityModal(true)}
          onRemovePortfolioFile={removePortfolioFile}
          userId={userId}
          handleSaveDraft={handleSaveDraft}
        />
          </div>

          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                Forrige
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button 
                onClick={nextStep} 
                disabled={!isStepValid()}
                className="ml-auto"
              >
                Neste
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={saving || !isStepValid()}
                className="ml-auto gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isEditingPublished ? 'Oppdater tilbud' : 'Publiser tilbud'}
              </Button>
            )}
          </div>
        </main>
        </>
      )}

      {/* Show Session Musician Wizard */}
      {conceptType === 'session_musician' && (
        <SessionMusicianWizard
          userId={userId}
          onSuccess={() => {
            toast({
              title: '🎉 Tilbud publisert!',
              description: 'Ditt tilbud er nå synlig for andre',
            });
            navigate('/dashboard');
          }}
          onBack={() => {
            if (!draftId) {
              setConceptType(null);
            } else {
              navigate('/dashboard');
            }
          }}
          existingConcept={conceptData.id ? {
            ...conceptData,
            available_dates: conceptData.available_dates,
            portfolio_files: conceptData.portfolio_files,
            tech_spec_reference: conceptData.selected_tech_spec_file,
            hospitality_rider_reference: conceptData.selected_hospitality_rider_file,
          } : undefined}
        />
      )}

      {/* Filbank Selection Modal - Shared by all wizards */}
      <FilebankSelectionModal
        isOpen={showFilebankModal}
        onClose={() => setShowFilebankModal(false)}
        onSelect={handleFileSelected}
        userId={userId}
        category="all"
        title="Velg Portfolio Filer"
        description="Velg filer fra din filbank for å legge til i portfolio"
      />

      {/* Tech Spec Selection Modal */}
      <FilebankSelectionModal
        isOpen={showTechSpecModal}
        onClose={() => setShowTechSpecModal(false)}
        onSelect={handleTechSpecFileSelected}
        userId={userId}
        fileTypes={['document']}
        title="Velg Tech Spec"
        description="Velg en tech spec fil fra din filbank"
        onNavigateToFilbank={async () => {
          await handleSaveDraft();
        }}
      />

      {/* Hospitality Rider Selection Modal */}
      <FilebankSelectionModal
        isOpen={showHospitalityModal}
        onClose={() => setShowHospitalityModal(false)}
        onSelect={handleHospitalityFileSelected}
        userId={userId}
        fileTypes={['document']}
        title="Velg Hospitality Rider"
        description="Velg en hospitality rider fil fra din filbank"
        onNavigateToFilbank={async () => {
          await handleSaveDraft();
        }}
      />
    </div>
  );
}
