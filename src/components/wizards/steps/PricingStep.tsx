import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WizardStepProps } from '../BaseConceptWizard';

/**
 * PricingStep - Pricing and audience configuration
 * Supports fixed price, door deal, and by agreement
 */
export const PricingStep = React.memo(({ data, updateData }: WizardStepProps) => {
  return (
    <div className="space-y-6">
      {/* Pricing Model */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <Label className="text-base font-semibold">Prismodell</Label>
        <RadioGroup
          value={data.pricing_type || 'fixed'}
          onValueChange={(value: 'fixed' | 'door_deal' | 'by_agreement') => {
            updateData('pricing_type', value);
            // Clear related fields when switching types
            if (value !== 'fixed') updateData('price', '');
            if (value !== 'door_deal') updateData('door_percentage', '');
          }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="fixed-price" />
            <Label htmlFor="fixed-price" className="cursor-pointer">
              Fast pris
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="door_deal" id="door-deal" />
            <Label htmlFor="door-deal" className="cursor-pointer">
              Døravtale (prosent av billettinntekter)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="by_agreement" id="by-agreement" />
            <Label htmlFor="by-agreement" className="cursor-pointer">
              Etter avtale
            </Label>
          </div>
        </RadioGroup>

        {/* Fixed Price Input */}
        {data.pricing_type === 'fixed' && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
            <Label htmlFor="price">Pris (NOK)</Label>
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

        {/* Door Deal Input */}
        {data.pricing_type === 'door_deal' && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <Label htmlFor="door-percentage">Prosent av billettinntekter</Label>
            <Input
              id="door-percentage"
              type="number"
              placeholder="70"
              value={data.door_percentage || ''}
              onChange={(e) => updateData('door_percentage', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Du får {data.door_percentage || 'X'}% av billettinntektene
            </p>
          </div>
        )}

        {/* By Agreement */}
        {data.pricing_type === 'by_agreement' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Pris avtales direkte med arrangør basert på spillested, varighet og andre faktorer
            </p>
          </div>
        )}
      </div>

      {/* Audience */}
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
