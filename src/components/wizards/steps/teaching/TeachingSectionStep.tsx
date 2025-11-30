import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { WizardStepProps } from '../../BaseConceptWizard';

interface TeachingField {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
  enabled: boolean;
}

interface TeachingSectionStepProps extends WizardStepProps {
  sectionKey: string;
}

/**
 * TeachingSectionStep - Reusable component for teaching agreement sections
 */
export const TeachingSectionStep = ({ data, updateData, sectionKey }: TeachingSectionStepProps) => {
  const sections = data.sections || {};
  const fields = sections[sectionKey] || [];

  const addCustomField = () => {
    const updatedSections = {
      ...sections,
      [sectionKey]: [
        ...fields,
        {
          id: `custom_${Date.now()}`,
          label: '',
          value: '',
          isCustom: true,
          enabled: true,
        },
      ],
    };
    updateData('sections', updatedSections);
  };

  const removeCustomField = (fieldId: string) => {
    const updatedSections = {
      ...sections,
      [sectionKey]: fields.filter((f: TeachingField) => f.id !== fieldId),
    };
    updateData('sections', updatedSections);
  };

  const updateField = (fieldId: string, updates: Partial<TeachingField>) => {
    const updatedSections = {
      ...sections,
      [sectionKey]: fields.map((f: TeachingField) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    };
    updateData('sections', updatedSections);
  };

  return (
    <div className="space-y-4">
      {fields.map((field: TeachingField) => (
        <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox
            checked={field.enabled}
            onCheckedChange={(checked) => updateField(field.id, { enabled: checked as boolean })}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            {field.isCustom ? (
              <Input
                placeholder="Feltnavn"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                className="font-medium"
              />
            ) : (
              <Label className="font-medium">{field.label}</Label>
            )}

            {field.enabled &&
              (field.id === 'lesson_length' ? (
                <Select
                  value={field.value}
                  onValueChange={(value) => updateField(field.id, { value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutter</SelectItem>
                    <SelectItem value="45">45 minutter</SelectItem>
                    <SelectItem value="60">60 minutter</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Fyll inn..."
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                />
              ))}
          </div>
          {field.isCustom && (
            <Button variant="ghost" size="sm" onClick={() => removeCustomField(field.id)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={addCustomField} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Legg til eget felt
      </Button>
    </div>
  );
};
