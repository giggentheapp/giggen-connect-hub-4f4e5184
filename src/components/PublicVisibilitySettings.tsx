import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface PublicVisibilitySettingsProps {
  value: Record<string, boolean>;
  onChange: (settings: Record<string, boolean>) => void;
  mode?: 'booking' | 'teaching';
}

const BOOKING_VISIBILITY_FIELDS = [
  { key: 'show_description', label: 'Beskrivelse', defaultValue: true },
  { key: 'show_venue', label: 'Spillested', defaultValue: true },
  { key: 'show_address', label: 'Adresse', defaultValue: true },
  { key: 'show_date', label: 'Dato', defaultValue: true },
  { key: 'show_time', label: 'Tidspunkt', defaultValue: true },
  { key: 'show_ticket_price', label: 'Billettpris', defaultValue: true },
  { key: 'show_artist_fee', label: 'Honorar', defaultValue: false },
  { key: 'show_audience_estimate', label: 'Forventet publikum', defaultValue: true },
  { key: 'show_door_deal', label: 'Dørprosent avtale', defaultValue: false },
  { key: 'show_portfolio', label: 'Portfolio filer', defaultValue: true },
  { key: 'show_artist_bio', label: 'Artist bio', defaultValue: true },
];

const TEACHING_VISIBILITY_FIELDS = [
  { key: 'show_description', label: 'Beskrivelse', defaultValue: true },
  { key: 'show_schedule', label: 'Undervisningstider', defaultValue: true },
  { key: 'show_payment', label: 'Betaling', defaultValue: false },
  { key: 'show_responsibilities', label: 'Ansvar og forventninger', defaultValue: true },
  { key: 'show_focus', label: 'Fokus og innhold', defaultValue: true },
  { key: 'show_termination', label: 'Oppsigelsesvilkår', defaultValue: false },
  { key: 'show_liability', label: 'Forsikring og ansvar', defaultValue: true },
  { key: 'show_communication', label: 'Kommunikasjon og avlysning', defaultValue: true },
  { key: 'show_portfolio', label: 'Portfolio filer', defaultValue: true },
];

export const PublicVisibilitySettings = ({ value, onChange, mode = 'booking' }: PublicVisibilitySettingsProps) => {
  const handleToggle = (key: string, checked: boolean) => {
    onChange({
      ...value,
      [key]: checked,
    });
  };

  const visibilityFields = mode === 'teaching' ? TEACHING_VISIBILITY_FIELDS : BOOKING_VISIBILITY_FIELDS;
  const alertText = mode === 'teaching' 
    ? '💡 Betaling og oppsigelsesvilkår er som standard skjult fra offentligheten'
    : '💡 Honorar og dørprosent er som standard skjult fra offentligheten';

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Offentlig synlighet
        </CardTitle>
        <CardDescription>
          Velg hva som skal vises i offentlig visning. Det som ikke er krysset av vises kun i forhandlingsfasen mellom dere.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-100/50 dark:bg-blue-950/10">
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            {alertText}
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {visibilityFields.map((field) => {
            const isChecked = value[field.key] ?? field.defaultValue;
            
            return (
              <div key={field.key} className="flex items-center space-x-2">
                <Checkbox
                  id={field.key}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleToggle(field.key, checked as boolean)}
                />
                <Label
                  htmlFor={field.key}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
