import { WizardStepProps } from '../../BaseConceptWizard';
import { TeachingSectionStep } from './TeachingSectionStep';

/**
 * TeachingPaymentStep - Payment section for teaching wizard
 */
export const TeachingPaymentStep = ({ data, updateData, userId }: WizardStepProps) => {
  return (
    <TeachingSectionStep
      sectionKey="payment"
      sections={data.sections}
      updateSections={(sections) => updateData('sections', sections)}
      data={data}
      updateData={updateData}
      userId={userId}
    />
  );
};
