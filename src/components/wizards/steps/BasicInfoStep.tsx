import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WizardStepProps } from '../BaseConceptWizard';

interface BasicInfoStepProps extends WizardStepProps {
  placeholder?: string;
}

/**
 * BasicInfoStep - Common first step for all concept types
 * Collects title and description
 */
export const BasicInfoStep = ({ data, updateData, placeholder }: BasicInfoStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Tittel *</Label>
        <Input
          id="title"
          placeholder={placeholder || "F.eks. 'Live Jazz Konsert'"}
          value={data.title || ''}
          onChange={(e) => updateData('title', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          placeholder="Beskriv ditt tilbud..."
          value={data.description || ''}
          onChange={(e) => updateData('description', e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
};
