import React, { useCallback } from 'react';
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
export const BasicInfoStep = React.memo(({ data, updateData, placeholder }: BasicInfoStepProps) => {
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('title', e.target.value);
  }, [updateData]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateData('description', e.target.value);
  }, [updateData]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Tittel *</Label>
        <Input
          id="title"
          placeholder={placeholder || "F.eks. 'Live Jazz Konsert'"}
          value={data.title || ''}
          onChange={handleTitleChange}
        />
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          placeholder="Beskriv ditt tilbud..."
          value={data.description || ''}
          onChange={handleDescriptionChange}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
});
