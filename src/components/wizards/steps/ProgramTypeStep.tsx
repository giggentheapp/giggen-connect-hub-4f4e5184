import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { WizardStepProps } from '../BaseConceptWizard';

/**
 * ProgramTypeStep - For arrangør_tilbud
 * Combines program type selection with pricing and audience
 */
export const ProgramTypeStep = React.memo(({ data, updateData }: WizardStepProps) => {
  return (
    <div className="space-y-6">
      {/* Programtype Selector */}
      <div>
        <Label htmlFor="program-type">Programtype *</Label>
        <Select
          value={data.program_type || ''}
          onValueChange={(value) => updateData('program_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg programtype..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="standup">Standup</SelectItem>
            <SelectItem value="jam">Jam Session</SelectItem>
            <SelectItem value="visekveld">Visekveld</SelectItem>
            <SelectItem value="lokale_helter">Lokale Helter</SelectItem>
            <SelectItem value="open_mic">Open Mic</SelectItem>
            <SelectItem value="annet">Annet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prismodell */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <Label className="text-base font-semibold">Prismodell *</Label>
        <RadioGroup
          value={data.pricing_type || 'fixed'}
          onValueChange={(value: 'fixed' | 'door_deal' | 'by_agreement') => {
            updateData('pricing_type', value);
            if (value !== 'fixed') updateData('price', '');
            if (value !== 'door_deal') updateData('door_percentage', '');
          }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="fixed-price" />
            <Label htmlFor="fixed-price" className="cursor-pointer">Fast pris</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="door_deal" id="door-deal" />
            <Label htmlFor="door-deal" className="cursor-pointer">Døravtale (%)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="by_agreement" id="by-agreement" />
            <Label htmlFor="by-agreement" className="cursor-pointer">Pris etter avtale</Label>
          </div>
        </RadioGroup>

        {data.pricing_type === 'fixed' && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
            <Label htmlFor="price">Pris (NOK) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="5000"
              value={data.price || ''}
              onChange={(e) => updateData('price', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Fast honorar for oppdraget
            </p>
          </div>
        )}

        {data.pricing_type === 'door_deal' && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <Label htmlFor="door-percentage">Prosent av inntekter *</Label>
            <Input
              id="door-percentage"
              type="number"
              placeholder="50"
              value={data.door_percentage || ''}
              onChange={(e) => updateData('door_percentage', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Du får {data.door_percentage || 'X'}% av billettinntektene
            </p>
          </div>
        )}

        {data.pricing_type === 'by_agreement' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Pris avtales direkte med musikere basert på spillested, varighet og andre faktorer
            </p>
          </div>
        )}
      </div>

      {/* Publikum */}
      <div>
        <Label htmlFor="audience">Forventet publikum *</Label>
        <Input
          id="audience"
          type="number"
          placeholder="100"
          value={data.expected_audience || ''}
          onChange={(e) => updateData('expected_audience', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Estimert antall publikummere
        </p>
      </div>
    </div>
  );
});
