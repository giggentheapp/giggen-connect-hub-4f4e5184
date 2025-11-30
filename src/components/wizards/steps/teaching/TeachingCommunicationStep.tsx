import { WizardStepProps } from '../../BaseConceptWizard';
import { TeachingSectionStep } from './TeachingSectionStep';

/**
 * TeachingCommunicationStep - Communication section for teaching wizard
 */
export const TeachingCommunicationStep = ({ data, updateData, userId }: WizardStepProps) => {
  return (
    <TeachingSectionStep
      sectionKey="communication"
      sections={data.sections}
      updateSections={(sections) => updateData('sections', sections)}
      data={data}
      updateData={updateData}
      userId={userId}
    />
  );
};
