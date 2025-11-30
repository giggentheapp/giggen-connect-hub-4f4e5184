import { WizardStepProps } from '../../BaseConceptWizard';
import { TeachingSectionStep } from './TeachingSectionStep';

/**
 * TeachingFocusStep - Focus section for teaching wizard
 */
export const TeachingFocusStep = ({ data, updateData, userId }: WizardStepProps) => {
  return (
    <TeachingSectionStep
      sectionKey="focus"
      sections={data.sections}
      updateSections={(sections) => updateData('sections', sections)}
      data={data}
      updateData={updateData}
      userId={userId}
    />
  );
};
