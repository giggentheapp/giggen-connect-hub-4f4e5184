import { PublicVisibilitySettings } from '@/components/PublicVisibilitySettings';
import { WizardStepProps } from '../../BaseConceptWizard';

/**
 * TeachingVisibilityStep - Public visibility settings for teaching wizard
 */
export const TeachingVisibilityStep = ({ data, updateData }: WizardStepProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Velg hvilke deler av undervisningsavtalen som skal være offentlig synlig.
        Dette lar musikere se viktig informasjon før de kontakter deg.
      </p>

      <PublicVisibilitySettings
        value={data.visibilitySettings || {
          show_description: true,
          show_schedule: true,
          show_payment: true,
          show_portfolio: true,
        }}
        onChange={(settings) => updateData('visibilitySettings', settings)}
        mode="teaching"
      />
    </div>
  );
};
