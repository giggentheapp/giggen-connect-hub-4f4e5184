import { WizardStepProps } from '../../BaseConceptWizard';
import { TeachingSectionStep } from './TeachingSectionStep';

/**
 * TeachingLiabilityStep - Liability section for teaching wizard
 */
export const TeachingLiabilityStep = ({ data, updateData, userId }: WizardStepProps) => {
  return (
    <TeachingSectionStep
      sectionKey="liability"
      sections={data.sections}
      updateSections={(sections) => updateData('sections', sections)}
      data={data}
      updateData={updateData}
      userId={userId}
    />
  );
};
