import { WizardStepProps } from '../../BaseConceptWizard';
import { TeachingSectionStep } from './TeachingSectionStep';

/**
 * TeachingResponsibilitiesStep - Responsibilities section for teaching wizard
 */
export const TeachingResponsibilitiesStep = ({ data, updateData, userId }: WizardStepProps) => {
  return (
    <TeachingSectionStep
      sectionKey="responsibilities"
      sections={data.sections}
      updateSections={(sections) => updateData('sections', sections)}
      data={data}
      updateData={updateData}
      userId={userId}
    />
  );
};
