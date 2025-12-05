import { useMemo } from 'react';
import { BaseConceptWizard, WizardConfig } from './BaseConceptWizard';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ProgramTypeStep } from './steps/ProgramTypeStep';
import { PortfolioStep } from './steps/PortfolioStep';
import { TechnicalStep } from './steps/TechnicalStep';
import { DatesStep } from './steps/DatesStep';
import { PreviewStep } from './steps/PreviewStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ArrangørTilbudWizardProps {
  userId: string;
  onSuccess: () => void;
  onBack?: () => void;
  existingConcept?: any;
}

/**
 * ArrangørTilbudWizard - Wrapper that configures BaseConceptWizard for arrangør_tilbud offers
 * 
 * Uses sticky-header layout and includes program_type field
 */
export const ArrangørTilbudWizard = ({
  userId,
  onSuccess,
  onBack,
  existingConcept,
}: ArrangørTilbudWizardProps) => {
  const { toast } = useToast();

  const config: WizardConfig = useMemo(() => ({
    conceptType: 'arrangør_tilbud',
    layout: 'sticky-header',
    steps: [
      {
        id: 'basic',
        title: 'Grunnleggende',
        description: 'Tittel og beskrivelse',
        component: BasicInfoStep,
        validation: (data) => !!data.title?.trim(),
      },
      {
        id: 'details',
        title: 'Detaljer',
        description: 'Programtype, pris og publikum',
        component: ProgramTypeStep,
        validation: (data) => {
          const programTypeValid = !!data.program_type;
          const audienceValid = data.expected_audience && parseInt(data.expected_audience) > 0;
          const pricingValid = data.pricing_type === 'by_agreement' || 
                            (data.pricing_type === 'fixed' && data.price) ||
                            (data.pricing_type === 'door_deal' && data.door_percentage);
          return programTypeValid && audienceValid && pricingValid;
        },
      },
      {
        id: 'portfolio',
        title: 'Portfolio',
        description: 'Last opp filer',
        component: PortfolioStep,
      },
      {
        id: 'technical',
        title: 'Teknisk',
        description: 'Tech spec og rider',
        component: TechnicalStep,
      },
      {
        id: 'dates',
        title: 'Datoer',
        description: 'Tilgjengelige datoer',
        component: DatesStep,
        validation: (data) => data.available_dates?.length > 0 || data.is_indefinite,
      },
      {
        id: 'preview',
        title: 'Forhåndsvisning',
        description: 'Gjennomgå og publiser',
        component: PreviewStep,
      },
    ],
    defaultData: {
      title: '',
      description: '',
      program_type: '',
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
      ...existingConcept, // Merge existing data if editing
    },
    onSave: async (data, isPublished) => {
      // Validering
      if (!data.title.trim()) {
        throw new Error('Tittel påkrevd');
      }

      if (isPublished) {
        if (!data.program_type) {
          throw new Error('Programtype påkrevd');
        }
        if (!data.expected_audience || parseInt(data.expected_audience) <= 0) {
          throw new Error('Publikumsestimat påkrevd');
        }
        if (data.pricing_type === 'fixed' && (!data.price || parseFloat(data.price) <= 0)) {
          throw new Error('Pris påkrevd');
        }
        if (data.pricing_type === 'door_deal' && (!data.door_percentage || parseFloat(data.door_percentage) <= 0)) {
          throw new Error('Døravtale prosent påkrevd');
        }
        if (!data.is_indefinite && (!data.available_dates || data.available_dates.length === 0)) {
          throw new Error('Tilgjengelige datoer påkrevd');
        }
      }

      // Ensure tech_spec_reference and hospitality_rider_reference are null if empty/invalid UUID
      // Must be valid UUID (36 chars with dashes) to avoid FK constraint errors
      const isValidUUID = (val: any): boolean => {
        if (!val || typeof val !== 'string') return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      };
      const techSpecRef = isValidUUID(data.selected_tech_spec_file) ? data.selected_tech_spec_file : null;
      const hospitalityRef = isValidUUID(data.selected_hospitality_rider_file) ? data.selected_hospitality_rider_file : null;

      const payload = {
        maker_id: userId,
        concept_type: 'arrangør_tilbud',
        title: data.title,
        description: data.description || null,
        program_type: data.program_type || null,
        price: data.pricing_type === 'fixed' && data.price ? parseFloat(data.price) : null,
        door_deal: data.pricing_type === 'door_deal',
        door_percentage: data.pricing_type === 'door_deal' && data.door_percentage ? parseFloat(data.door_percentage) : null,
        price_by_agreement: data.pricing_type === 'by_agreement',
        expected_audience: data.expected_audience ? parseInt(data.expected_audience) : null,
        tech_spec: data.tech_spec || null,
        tech_spec_reference: techSpecRef,
        hospitality_rider_reference: hospitalityRef,
        available_dates: data.is_indefinite 
          ? { indefinite: true }
          : (data.available_dates.length > 0 ? data.available_dates : null),
        is_published: isPublished,
        status: isPublished ? 'active' : 'draft',
        updated_at: new Date().toISOString(),
      };

      let conceptId = data.id;

      if (conceptId) {
        const { error } = await supabase
          .from('concepts')
          .update(payload)
          .eq('id', conceptId);
        if (error) throw error;
      } else {
        const { data: newConcept, error } = await supabase
          .from('concepts')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        conceptId = newConcept.id;
      }

      // Save portfolio files to concept_files table (only new files without conceptFileId)
      if (conceptId && data.portfolio_files.length > 0) {
        const newFiles = data.portfolio_files.filter((file: any) => !file.conceptFileId);
        
        if (newFiles.length > 0) {
          const conceptFilesData = newFiles.map((file: any) => ({
            concept_id: conceptId,
            creator_id: userId,
            filename: file.filename,
            file_path: file.file_path,
            file_url: file.publicUrl,
            file_type: file.file_type,
            mime_type: file.mime_type,
            file_size: file.file_size,
            title: file.title || file.filename,
            thumbnail_path: file.thumbnail_path || null,
            is_public: true,
          }));

          const { error: filesError } = await supabase
            .from('concept_files')
            .insert(conceptFilesData);

          if (filesError) {
            console.error('Error saving portfolio files:', filesError);
            toast({
              title: 'Advarsel',
              description: 'Konseptet ble lagret, men noen porteføljefiler kunne ikke lagres',
              variant: 'destructive',
            });
          }
        }
      }

      onSuccess();
    },
    onBack,
  }), [existingConcept, userId, onSuccess, onBack]);

  return <BaseConceptWizard config={config} userId={userId} />;
};
