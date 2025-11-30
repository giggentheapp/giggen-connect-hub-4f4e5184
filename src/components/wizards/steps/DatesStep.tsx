import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { WizardStepProps } from '../BaseConceptWizard';
import { Card, CardContent } from '@/components/ui/card';

/**
 * DatesStep - Available dates configuration
 * Supports multiple date selection or indefinite availability
 */
export const DatesStep = ({ data, updateData }: WizardStepProps) => {
  const selectedDates = data.available_dates || [];
  const isIndefinite = data.is_indefinite || false;

  const handleDateSelect = (dates: Date[] | undefined) => {
    updateData('available_dates', dates || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <Label>Jeg er tilgjengelig hele tiden</Label>
          <p className="text-sm text-muted-foreground">
            Velg dette hvis du ikke har spesifikke datoer
          </p>
        </div>
        <Switch
          checked={isIndefinite}
          onCheckedChange={(checked) => {
            updateData('is_indefinite', checked);
            if (checked) {
              updateData('available_dates', []);
            }
          }}
        />
      </div>

      {!isIndefinite && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Velg tilgjengelige datoer</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg én eller flere datoer du er tilgjengelig
                </p>
              </div>
              
              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </div>

              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Valgte datoer ({selectedDates.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((date: Date, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {date.toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isIndefinite && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Du er tilgjengelig hele tiden. Arrangører kan kontakte deg når som helst.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
