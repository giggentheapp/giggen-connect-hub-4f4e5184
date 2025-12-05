import { useMemo } from 'react';
import { BaseConceptWizard, WizardConfig } from './BaseConceptWizard';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PortfolioStep } from './steps/PortfolioStep';
import { PreviewStep } from './steps/PreviewStep';
import { TeachingIntroStep } from './steps/teaching/TeachingIntroStep';
import { TeachingScheduleStep } from './steps/teaching/TeachingScheduleStep';
import { TeachingPaymentStep } from './steps/teaching/TeachingPaymentStep';
import { TeachingResponsibilitiesStep } from './steps/teaching/TeachingResponsibilitiesStep';
import { TeachingFocusStep } from './steps/teaching/TeachingFocusStep';
import { TeachingTerminationStep } from './steps/teaching/TeachingTerminationStep';
import { TeachingLiabilityStep } from './steps/teaching/TeachingLiabilityStep';
import { TeachingCommunicationStep } from './steps/teaching/TeachingCommunicationStep';
import { TeachingVisibilityStep } from './steps/teaching/TeachingVisibilityStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeachingWizardProps {
  userId: string;
  onSuccess: () => void;
  onBack?: () => void;
  existingConcept?: any;
}

const DEFAULT_SECTIONS = {
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

/**
 * TeachingWizard - Wrapper that configures BaseConceptWizard for teaching concepts
 * 
 * Uses card layout and includes teaching-specific sections
 */
export const TeachingWizard = ({
  userId,
  onSuccess,
  onBack,
  existingConcept,
}: TeachingWizardProps) => {
  const { toast } = useToast();

  const config: WizardConfig = useMemo(() => ({
    conceptType: 'teaching',
    layout: 'card',
    steps: [
      {
        id: 'intro',
        title: 'Introduksjon',
        description: 'Hva er dette?',
        component: TeachingIntroStep,
      },
      {
        id: 'basic',
        title: 'Grunnleggende',
        description: 'Tittel og beskrivelse',
        component: BasicInfoStep,
        validation: (data) => !!data.title?.trim(),
      },
      {
        id: 'portfolio',
        title: 'Portfolio',
        description: 'Last opp filer',
        component: PortfolioStep,
      },
      {
        id: 'schedule',
        title: 'Undervisningstider',
        description: 'Lokasjon og tidspunkt',
        component: TeachingScheduleStep,
      },
      {
        id: 'payment',
        title: 'Betaling',
        description: 'Betalingsbetingelser',
        component: TeachingPaymentStep,
      },
      {
        id: 'responsibilities',
        title: 'Ansvar',
        description: 'Elevens ansvar og forventninger',
        component: TeachingResponsibilitiesStep,
      },
      {
        id: 'focus',
        title: 'Fokus',
        description: 'Innhold og tema',
        component: TeachingFocusStep,
      },
      {
        id: 'termination',
        title: 'Avslutning',
        description: 'Oppsigelse og varsel',
        component: TeachingTerminationStep,
      },
      {
        id: 'liability',
        title: 'Forsikring',
        description: 'Ansvar og forsikring',
        component: TeachingLiabilityStep,
      },
      {
        id: 'communication',
        title: 'Kommunikasjon',
        description: 'Avlysning og kommunikasjon',
        component: TeachingCommunicationStep,
      },
      {
        id: 'visibility',
        title: 'Offentlig synlighet',
        description: 'Hva skal vises offentlig',
        component: TeachingVisibilityStep,
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
      portfolio_files: [],
      sections: existingConcept?.teaching_data || DEFAULT_SECTIONS,
      available_dates: [],
      is_indefinite: false,
      visibilitySettings: {
        show_description: true,
        show_schedule: true,
        show_payment: true,
        show_portfolio: true,
      },
      ...existingConcept,
    },
    onSave: async (data, isPublished) => {
      if (!data.title.trim()) {
        throw new Error('Tittel påkrevd');
      }

      const payload = {
        maker_id: userId,
        title: data.title,
        description: data.description || null,
        concept_type: 'teaching',
        teaching_data: data.sections as any,
        available_dates: data.is_indefinite 
          ? { indefinite: true }
          : (data.available_dates?.length > 0 ? data.available_dates : null),
        is_published: isPublished,
        status: isPublished ? 'published' : 'draft',
        public_visibility_settings: data.visibilitySettings,
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
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        conceptId = newConcept.id;
      }

      // Save portfolio files to concept_files table (only new files without conceptFileId)
      if (conceptId && data.portfolio_files?.length > 0) {
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
