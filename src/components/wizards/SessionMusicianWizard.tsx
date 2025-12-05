import { useMemo } from 'react';
import { BaseConceptWizard, WizardConfig } from './BaseConceptWizard';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PricingStep } from './steps/PricingStep';
import { PortfolioStep } from './steps/PortfolioStep';
import { TechnicalStep } from './steps/TechnicalStep';
import { DatesStep } from './steps/DatesStep';
import { PreviewStep } from './steps/PreviewStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SessionMusicianWizardProps {
  userId: string;
  onSuccess: () => void;
  onBack?: () => void;
  existingConcept?: any;
}

/**
 * SessionMusicianWizard - Wrapper that configures BaseConceptWizard for session_musician offers
 * 
 * Uses sticky-header layout and session musician specific workflow
 */
export const SessionMusicianWizard = ({
  userId,
  onSuccess,
  onBack,
  existingConcept,
}: SessionMusicianWizardProps) => {
  const { toast } = useToast();

  const config: WizardConfig = useMemo(() => ({
    conceptType: 'session_musician',
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
        description: 'Pris og publikum',
        component: PricingStep,
        validation: (data) => {
          const audienceValid =
            data.expected_audience && parseInt(data.expected_audience) > 0;
          const pricingValid =
            data.pricing_type === 'by_agreement' ||
            (data.pricing_type === 'fixed' && data.price) ||
            (data.pricing_type === 'door_deal' && data.door_percentage);
          return audienceValid && pricingValid;
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
      id: existingConcept?.id,
      title: existingConcept?.title || '',
      description: existingConcept?.description || '',
      price: existingConcept?.price?.toString() || '',
      expected_audience: existingConcept?.expected_audience?.toString() || '',
      tech_spec: existingConcept?.tech_spec || '',
      available_dates: existingConcept?.available_dates
        ? Array.isArray(existingConcept.available_dates)
          ? existingConcept.available_dates.map((d: any) => new Date(d))
          : []
        : [],
      portfolio_files: existingConcept?.portfolio_files || [],
      selected_tech_spec_file: existingConcept?.tech_spec_reference || '',
      selected_hospitality_rider_file: existingConcept?.hospitality_rider_reference || '',
      is_indefinite: existingConcept?.available_dates &&
        typeof existingConcept.available_dates === 'object' &&
        existingConcept.available_dates.indefinite
        ? true
        : false,
      pricing_type: existingConcept?.door_deal
        ? 'door_deal'
        : existingConcept?.price_by_agreement
        ? 'by_agreement'
        : 'fixed',
      door_percentage: existingConcept?.door_percentage?.toString() || '',
      program_type: existingConcept?.program_type || '',
    },
    onSave: async (data, isPublished) => {
      const payload = {
        maker_id: userId,
        concept_type: 'session_musician',
        title: data.title,
        description: data.description || null,
        price:
          data.pricing_type === 'fixed' && data.price ? parseFloat(data.price) : null,
        door_deal: data.pricing_type === 'door_deal',
        door_percentage:
          data.pricing_type === 'door_deal' && data.door_percentage
            ? parseFloat(data.door_percentage)
            : null,
        price_by_agreement: data.pricing_type === 'by_agreement',
        expected_audience: data.expected_audience
          ? parseInt(data.expected_audience)
          : null,
        tech_spec: data.tech_spec || null,
        tech_spec_reference: data.selected_tech_spec_file || null,
        hospitality_rider_reference: data.selected_hospitality_rider_file || null,
        program_type: data.program_type || null,
        available_dates: data.is_indefinite
          ? JSON.stringify({ indefinite: true })
          : data.available_dates.length > 0
          ? JSON.stringify(data.available_dates)
          : null,
        is_published: isPublished,
        status: isPublished ? 'published' : 'draft',
        updated_at: new Date().toISOString(),
      };

      let conceptId = data.id;

      if (conceptId) {
        // Update existing concept
        const { error } = await supabase
          .from('concepts')
          .update(payload)
          .eq('id', conceptId);

        if (error) throw error;
      } else {
        // Create new concept
        const { data: createdConcept, error } = await supabase
          .from('concepts')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;
        conceptId = createdConcept.id;
      }

      // Save portfolio files (only new files without conceptFileId)
      if (conceptId && data.portfolio_files?.length > 0) {
        const newFiles = data.portfolio_files.filter(
          (file: any) => !file.conceptFileId
        );

        if (newFiles.length > 0) {
          const fileRecords = newFiles.map((file: any) => ({
            creator_id: userId,
            concept_id: conceptId,
            filename: file.filename,
            file_path: file.file_path,
            file_type: file.file_type,
            file_url:
              file.publicUrl ||
              `https://hkcdyqghfqyrlwjcsrnx.supabase.co/storage/v1/object/public/filbank/${file.file_path}`,
            mime_type: file.mime_type,
            file_size: file.file_size,
            title: file.title || file.filename,
            thumbnail_path: file.thumbnail_path,
            is_public: false,
          }));

          const { error: filesError } = await supabase
            .from('concept_files')
            .insert(fileRecords);

          if (filesError) {
            console.error('Error saving portfolio files:', filesError);
          }
        }
      }

      // On successful publish, call onSuccess
      if (isPublished) {
        onSuccess();
      }
    },
    onBack,
  }), [existingConcept, userId, onSuccess, onBack]);

  return <BaseConceptWizard config={config} userId={userId} />;
};
