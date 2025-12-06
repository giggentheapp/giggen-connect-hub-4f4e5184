import React, { useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { WizardStepProps } from '../BaseConceptWizard';
import { calculateExpectedRevenue, calculateArtistEarnings, formatCurrency } from '@/utils/conceptHelpers';
import { TrendingUp, Calculator } from 'lucide-react';

const TICKET_PRICE_SUGGESTIONS = [150, 200, 250, 300, 350];

/**
 * ProgramTypeStep - For arrangør_tilbud
 * Combines program type selection with pricing, audience, and ticket price
 */
export const ProgramTypeStep = React.memo(({ data, updateData }: WizardStepProps) => {
  const handleProgramTypeChange = useCallback((value: string) => {
    updateData('program_type', value);
  }, [updateData]);

  const handlePricingTypeChange = useCallback((value: 'fixed' | 'door_deal' | 'by_agreement') => {
    updateData('pricing_type', value);
    if (value !== 'fixed') updateData('price', '');
    if (value !== 'door_deal') updateData('door_percentage', '');
  }, [updateData]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('price', e.target.value);
  }, [updateData]);

  const handleDoorPercentageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('door_percentage', e.target.value);
  }, [updateData]);

  const handleAudienceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('expected_audience', e.target.value);
  }, [updateData]);

  const handleTicketPriceSuggestionChange = useCallback((value: string) => {
    if (value === 'custom') {
      updateData('ticket_price_mode', 'custom');
      updateData('ticket_price', '');
    } else {
      updateData('ticket_price_mode', 'suggested');
      updateData('ticket_price', value);
    }
  }, [updateData]);

  const handleTicketPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateData('ticket_price', e.target.value);
  }, [updateData]);

  // Calculate revenue and earnings
  const calculations = useMemo(() => {
    const audience = data.expected_audience ? parseInt(data.expected_audience) : null;
    const ticketPrice = data.ticket_price ? parseFloat(data.ticket_price) : null;
    const fixedPrice = data.price ? parseFloat(data.price) : null;
    const doorPercentage = data.door_percentage ? parseFloat(data.door_percentage) : null;
    
    const revenue = calculateExpectedRevenue(audience, ticketPrice);
    const pricingType = data.pricing_type || 'fixed';
    const artistEarnings = calculateArtistEarnings(revenue, pricingType, fixedPrice, doorPercentage);
    
    return { audience, ticketPrice, revenue, artistEarnings, pricingType, fixedPrice, doorPercentage };
  }, [data.expected_audience, data.ticket_price, data.price, data.door_percentage, data.pricing_type]);

  const showCustomTicketInput = data.ticket_price_mode === 'custom' || 
    (data.ticket_price && !TICKET_PRICE_SUGGESTIONS.includes(parseInt(data.ticket_price)));

  return (
    <div className="space-y-6">
      {/* Programtype Selector */}
      <div>
        <Label htmlFor="program-type">Programtype *</Label>
        <Select
          value={data.program_type || ''}
          onValueChange={handleProgramTypeChange}
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
          onValueChange={handlePricingTypeChange}
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
              onChange={handlePriceChange}
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
              onChange={handleDoorPercentageChange}
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
          onChange={handleAudienceChange}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Estimert antall publikummere
        </p>
      </div>

      {/* Billettpris */}
      <div className="space-y-3">
        <Label>Billettpris (frivillig)</Label>
        <p className="text-xs text-muted-foreground">
          Anslå billettpris for å beregne forventet inntekt
        </p>
        
        <Select
          value={
            showCustomTicketInput 
              ? 'custom' 
              : data.ticket_price 
                ? data.ticket_price.toString() 
                : ''
          }
          onValueChange={handleTicketPriceSuggestionChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg billettpris..." />
          </SelectTrigger>
          <SelectContent>
            {TICKET_PRICE_SUGGESTIONS.map((price) => (
              <SelectItem key={price} value={price.toString()}>
                {price} kr
              </SelectItem>
            ))}
            <SelectItem value="custom">Egen pris</SelectItem>
          </SelectContent>
        </Select>

        {showCustomTicketInput && (
          <Input
            type="number"
            placeholder="200"
            value={data.ticket_price || ''}
            onChange={handleTicketPriceChange}
            className="mt-2"
          />
        )}
      </div>

      {/* Revenue Calculation Display */}
      {calculations.revenue && (
        <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="h-4 w-4 text-primary" />
            Beregnet inntekt
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>
                Forventet dørsalg: {formatCurrency(calculations.audience!)} personer × {formatCurrency(calculations.ticketPrice!)} kr = <strong>{formatCurrency(calculations.revenue)} kr</strong>
              </span>
            </div>
            
            {calculations.pricingType === 'fixed' && calculations.fixedPrice && (
              <div className="text-muted-foreground pl-6">
                Betaling til artist: <strong>{formatCurrency(calculations.fixedPrice)} kr</strong> (fast)
              </div>
            )}
            
            {calculations.pricingType === 'door_deal' && calculations.doorPercentage && calculations.artistEarnings && (
              <div className="text-muted-foreground pl-6">
                Betaling til artist: {calculations.doorPercentage}% av {formatCurrency(calculations.revenue)} kr = <strong>{formatCurrency(calculations.artistEarnings)} kr</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
